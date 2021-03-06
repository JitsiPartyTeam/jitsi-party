import {contentTrackCarrierName, roomInfoPeeperName} from '@models/api/Constants'
import {t} from '@models/locales'
import {Pose2DMap} from '@models/MapObject'
import {priorityCalculator} from '@models/middleware/trafficControl'
import {defaultRemoteInformation, Mouse, PARTICIPANT_SIZE, Physics, RemoteInformation, TrackStates} from '@models/Participant'
import {SharedContent as ISharedContent} from '@models/SharedContent'
import {urlParameters} from '@models/url'
import {normV, subV2} from '@models/utils'
import chat, { ChatMessage, ChatMessageToSend } from '@stores/Chat'
import participants from '@stores/participants/Participants'
import {extractContentDataAndIds, makeItContent, makeThemContents} from '@stores/sharedContents/SharedContentCreator'
import contents from '@stores/sharedContents/SharedContents'
import JitsiMeetJS from 'lib-jitsi-meet'
import _ from 'lodash'
import {autorun, IReactionDisposer} from 'mobx'
import type {Conference} from './Conference'
import {ConferenceEvents} from './Conference'
import { notification } from './Notification'

export const MessageType = {
  CHAT_MESSAGE: 'm_chat',                       //  -> text chat message
  PARTICIPANT_POSE: 'mp',                       //  -> update presence once per 5 sec / message immediate value
  PARTICIPANT_MOUSE: 'mm',                      //  -> message
  PARTICIPANT_TRACKLIMITS: 'm_track_limits',    //  -> message, basically does not sync
  YARN_PHONE: 'YARN_PHONE',             //  -> message
  CONTENT_UPDATE_REQUEST: 'content_update',     //  -> message
  CONTENT_REMOVE_REQUEST: 'content_remove',     //  -> message
  CALL_REMOTE: 'call_remote',                   //  -> message, to give notification to a remote user.
  AFK_CHANGED: 'afk_changed',                   //
  FRAGMENT_HEAD: 'frag_head',
  FRAGMENT_CONTENT: 'frag_cont',
}

export const PropertyType = {
  PARTICIPANT_INFO: 'p_info',                   //  -> presence
  PARTICIPANT_POSE: 'p_pose',                   //  -> update presence once per 5 sec / message immediate value
  PARTICIPANT_PHYSICS: 'p_physics',             //  -> presence
  PARTICIPANT_TRACKSTATES: 'p_trackstates',     //  -> presence
  MAIN_SCREEN_CARRIER: 'main_screen_carrier',   //  -> presence
  MY_CONTENT: 'my_content',                     //  -> presence
}

//const FRAGMENTING_LENGTH = 200    //  For sctp
//const FRAGMENTING_LENGTH = 9000000  //  For websocket never flagmenting
const FRAGMENTING_LENGTH = 512 //  For websocket never flagmenting

interface FragmentedMessageHead{
  type: string
  length: number
}
interface FragmentedMessage{
  c: number
  s: string
}

const SYNC_LOG = false
const syncLog = SYNC_LOG ? console.log : () => {}

export class ConferenceSync{
  conference: Conference
  disposers: IReactionDisposer[] = []

  constructor(c:Conference) {
    this.conference = c
    //  setInterval(()=>{ this.checkRemoteAlive() }, 1000)
  }

  //  Only for test (admin config dialog).
  sendTrackLimits(to:string, limits?:string[]) {
    this.conference.sendMessage(MessageType.PARTICIPANT_TRACKLIMITS, to ? to : '', limits ? limits :
                                [participants.local.remoteVideoLimit, participants.local.remoteAudioLimit])
  }
  //  Send content update request to pid
  sendContentUpdateRequest(pid: string, updated: ISharedContent) {
    if (updated.url.length > FRAGMENTING_LENGTH) {
      this.sendFragmentedMessage(MessageType.CONTENT_UPDATE_REQUEST, pid, updated)
    }else {
      this.conference.sendMessage(MessageType.CONTENT_UPDATE_REQUEST, pid, updated)
    }
  }
  //  Send content remove request to pid
  sendContentRemoveRequest(pid: string, removed: string) {
    this.conference.sendMessage(MessageType.CONTENT_REMOVE_REQUEST, pid, removed)
  }
  //  send main screen carrir
  sendMainScreenCarrier(enabled: boolean) {
    const carrierId = contents.tracks.localMainConnection?.getParticipantId()
    if (carrierId) {
      this.conference.setLocalParticipantProperty(PropertyType.MAIN_SCREEN_CARRIER, {carrierId, enabled})
    }
  }
  //  send myContents of local to remote participants.
  sendMyContents() {
    const cs = Array.from(contents.localParticipant.myContents.values())
    const contentsToSend = extractContentDataAndIds(cs)
    syncLog(`send all contents ${JSON.stringify(contentsToSend.map(c => c.id))}.`,
            contentsToSend)
    this.conference.setLocalParticipantProperty(PropertyType.MY_CONTENT, contentsToSend)
  }

  bind() {
    //  participant related -----------------------------------------------------------------------
    //  track limit
    this.conference.on(MessageType.PARTICIPANT_TRACKLIMITS, (from:string, limits:string[]) => {
      participants.local.remoteVideoLimit = limits[0]
      participants.local.remoteAudioLimit = limits[1]
    })

    //  left/join
    this.conference.on(ConferenceEvents.USER_LEFT, (id) => {
      this.onParticipantLeft(id)
    })
    this.conference.on(ConferenceEvents.USER_JOINED, (id) => {
      const name = this.conference._jitsiConference?.getParticipantById(id).getDisplayName()
      if (name === contentTrackCarrierName || name === roomInfoPeeperName) {
        //  do nothing
      }else {
        participants.join(id)
      }
    })

    //  track
    this.conference.on(ConferenceEvents.REMOTE_TRACK_ADDED, (track) => {
      //  update priorty for setPerceptible message.
      priorityCalculator.onRemoteTrackAdded(track)

      //  console.log(`onRemoteTrackAdded ${track} videoType:'${track.videoType ? track.videoType : undefined}'.`)
      if (!participants.addRemoteTrack(track)) {
        contents.tracks.addRemoteTrack(track)
      }
    })
    this.conference.on(ConferenceEvents.REMOTE_TRACK_REMOVED, (track) => {
      //  console.log(`onRemoteTrackAdded ${track} videoType:'${track.videoType ? track.videoType : undefined}'.`)

      if (!participants.removeRemoteTrack(track)) {
        contents.tracks.removeRemoteTrack(track)
      }
    })

    //  chat
    this.conference.on(MessageType.CHAT_MESSAGE,
      (pid: string, msg: ChatMessageToSend) => {
        //  console.log(`PRIVATE_MESSAGE_RECEIVED id:${id}, text:${msg.msg}, ts:${msg.ts}`)
        const from = participants.find(pid)
        if (from){
          chat.addMessage(new ChatMessage(msg.msg, from.id, from.information.name,
            from.information.avatarSrc, from.getColor(), msg.ts, msg.to ? 'private':'text'))
        }
      }
    )
    //  call
    this.conference.on(MessageType.CALL_REMOTE, (from:string) => {
      const caller = participants.find(from)
      if (caller){
        chat.calledBy(caller)
        if (participants.local.information.notifyCall){
          notification(t('noCalled', {name: caller?.information.name}), {icon: './favicon.ico'})
        }
      }
    })
    this.disposers.push(autorun(() => {
      participants.remote.forEach((remote)=>{
        if (remote.called){
          remote.called = false
          this.conference.sendMessage(MessageType.CALL_REMOTE, remote.id, {})
          chat.callTo(remote)
        }
      })
    }))

    //  afk
    this.conference.on(MessageType.AFK_CHANGED, (from:string, afk: boolean) => {
      const remote = participants.find(from)
      if (remote){ remote.awayFromKeyboard = afk }
    })
    this.disposers.push(autorun(() => {
      this.conference.sendMessage(MessageType.AFK_CHANGED, '', participants.local.awayFromKeyboard)
    }))

    //  info
    this.conference.on(PropertyType.PARTICIPANT_INFO, (from:string, info:RemoteInformation) => {
      if (urlParameters.testBot !== null) { return }

      const remote = participants.remote.get(from)
      if (remote) {
        const name = remote.information.name
        Object.assign(remote.information, info)
        if (name !== remote.information.name){
          if (name === defaultRemoteInformation.name){
            chat.participantJoined(from)
          }else{
            chat.participantNameChanged(from, name)
          }
        }
      }
    })
    this.disposers.push(autorun(() => {
      this.conference.setLocalParticipantProperty(PropertyType.PARTICIPANT_INFO,
        {...participants.local.informationToSend})
        let name = participants.local.information.name
        while(name.slice(0,1) === '_'){ name = name.slice(1) }
      this.conference._jitsiConference?.setDisplayName(name)
    }))

    //  track states
    this.conference.on(PropertyType.PARTICIPANT_TRACKSTATES, (from:string, states:TrackStates) => {
      if (urlParameters.testBot !== null) { return }

      const remote = participants.remote.get(from)
      if (remote) {
        Object.assign(remote.trackStates, states)
      }
    })
    const sendTrackStates = () => {
      this.conference.setLocalParticipantProperty(PropertyType.PARTICIPANT_TRACKSTATES,
                                                  {...participants.local.trackStates})
    }
    this.disposers.push(autorun(sendTrackStates))

    //  pose
    const onPose = (from:string, poseStr:string) => {
      const poseArray = poseStr.split(',')
      const pose = {position:[Number(poseArray[0]), Number(poseArray[1])] as [number, number],
        orientation:Number(poseArray[2])}
      const remote = participants.remote.get(from)
      const local = participants.local
      if (remote) {
        remote.pose.orientation = pose.orientation
        remote.pose.position = pose.position
        remote.physics.located = true
        if (local.information.notifyNear || local.information.notifyTouch){
          const distance = normV(subV2(remote.pose.position, local.pose.position))
          const NEAR = PARTICIPANT_SIZE * 3
          const TOUCH = PARTICIPANT_SIZE
          if (remote.lastDistance > TOUCH &&  distance <= TOUCH
            && local.information.notifyTouch){
            notification(t('noTouched',{name: remote.information.name}), {icon: './favicon.ico'})
          }else if (remote.lastDistance > NEAR && distance < NEAR && local.information.notifyNear){
            notification(t('noNear', {name: remote.information.name}), {icon: './favicon.ico'})
          }
          remote.lastDistance = distance
        }
      }
    }
    this.conference.on(MessageType.PARTICIPANT_POSE, (from:string, str:string)=>{
      //  console.log(`MessageType.PARTICIPANT_POSE ${str}`)
      onPose(from, str)
    })
    this.conference.on(PropertyType.PARTICIPANT_POSE, (from:string, str:string)=>{
      //  console.log(`PropertyType.PARTICIPANT_POSE ${str}`)
      onPose(from, str)
    })
    let updateTimeForProperty = 0
    let poseWait = 0

    const calcWait = () => Math.ceil(Math.max((participants.remote.size / 3) * 33, 33))
    function round(n:number){ return Math.round(n*100) / 100 }
    function pose2Str(pose:Pose2DMap){ return `${round(pose.position[0])},${round(pose.position[1])},${round(pose.orientation)}`}

    let sendPoseMessage: (poseStr:string) => void = ()=>{}
    let lastPoseStr=''
    this.disposers.push(autorun(() => {
      const newWait = calcWait()
      if (newWait !== poseWait) {
        poseWait = newWait
        sendPoseMessage = _.throttle((poseStr:string) => {
          if (this.conference.channelOpened){
            this.conference.sendMessage(MessageType.PARTICIPANT_POSE, '', poseStr)
          }
        },                           poseWait)  //  30fps
        //  console.log(`poseWait = ${poseWait}`)
      }

      const poseStr = pose2Str(participants.local.pose)
      if (this.conference.channelOpened && lastPoseStr !== poseStr) {
        sendPoseMessage(poseStr)
        lastPoseStr = poseStr
      }
    }))
    let lastPoseStrProprty = ''
    const setPoseProperty = () => {
      const now = Date.now()
      const period = calcWait() * 30 //  (33ms(1 remote) to 1000ms(100 remotes)) * 30
      if (now - updateTimeForProperty > period) {  //  update period
        const poseStr = pose2Str(participants.local.pose)
        if (lastPoseStrProprty !== poseStr){
          this.conference.setLocalParticipantProperty(PropertyType.PARTICIPANT_POSE, poseStr)
          updateTimeForProperty = now
          lastPoseStrProprty = poseStr
        }
      }
    }
    setPoseProperty()
    setInterval(setPoseProperty, 2.5 * 1000)

    // mouse
    this.conference.on(MessageType.PARTICIPANT_MOUSE, (from:string, mouseStr:string) => {
      const mouseArray = mouseStr.split(',')
      const mouse:Mouse = {position:[Number(mouseArray[0]),Number(mouseArray[1])], show: mouseArray[2] ? true : false}
      if (urlParameters.testBot !== null) { return }
      const remote = participants.remote.get(from)
      if (remote) { Object.assign(remote.mouse, mouse) }
    })
    let wait = 0
    let sendMouseMessage = (mouse:Mouse) => {}
    const sendMouse = (to: string) => {
      const newWait = calcWait()
      if (wait !== newWait) {
        wait = newWait
        sendMouseMessage = _.throttle((mouse: Mouse) => {
          this.conference.sendMessage(MessageType.PARTICIPANT_MOUSE, '',
            `${mouse.position[0]},${mouse.position[1]},${mouse.show?'t':''}`)
        },                            wait)
      }
      if (this.conference.channelOpened) {
        sendMouseMessage({...participants.local.mouse})
      }
    }
    this.disposers.push(autorun(() => { sendMouse('') }))


    // physics
    this.conference.on(PropertyType.PARTICIPANT_PHYSICS, (from:string, physics:Physics) => {
      if (urlParameters.testBot !== null) { return }

      const remote = participants.remote.get(from)
      if (remote) {
        remote.physics.onStage = physics.onStage
      }
    })
    const sendPhysics = () => {
      if (this.conference.channelOpened) {
        this.conference.setLocalParticipantProperty(PropertyType.PARTICIPANT_PHYSICS, {...participants.local.physics})
      }
    }
    this.disposers.push(autorun(() => { sendPhysics() }))

    //  Yarn phone
    this.conference.on(MessageType.YARN_PHONE, (from:string, drArray:string[]) => {
      //  console.log(`yarn from ${from} local:${participants.localId}`)
      const myself = drArray.find(id => id === participants.localId)
      if (myself) {
        if (!participants.yarnPhones.has(from)){
          participants.yarnPhones.add(from)
          if (participants.local.information.notifyYarn){
            const remote = participants.find(from)
            if (remote){
              notification(t('noYarn', {name: remote.information.name}), {icon: './favicon.ico'})
            }
          }
        }
      }else {
        participants.yarnPhones.delete(from)
      }
    })
    const sendYarnPhones = () => {
      if (this.conference.channelOpened) {
        this.conference.sendMessage(MessageType.YARN_PHONE, '', Array.from(participants.yarnPhones))
      }
    }
    this.disposers.push(autorun(() => { sendYarnPhones() }))

    // contents related ---------------------------------------------------------------
    //  main screen track's carrier id
    this.conference.on(PropertyType.MAIN_SCREEN_CARRIER, (from: string, {carrierId, enabled}) => {
      const remote = participants.remote.get(from)
      if (remote) {
        contents.tracks.onMainScreenCarrier(carrierId, enabled)
      }
    })
    //  Receive remote contents.
    this.conference.on(PropertyType.MY_CONTENT, (from:string, cs_:ISharedContent[]) => {
      const cs = makeThemContents(cs_)
      contents.checkDuplicatedWallpaper(from, cs)
      contents.replaceRemoteContents(cs, from)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const remote = participants.remote.get(from)
      syncLog(`recv remote contents ${JSON.stringify(cs.map(c => c.id))} from ${from}.`, cs)
    })
    //  request
    this.conference.on(MessageType.CONTENT_UPDATE_REQUEST, (from:string, c:ISharedContent) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const content = makeItContent(c)
      contents.updateByRemoteRequest(content)
    })
    this.conference.on(MessageType.CONTENT_REMOVE_REQUEST, (from:string, cid:string) => {
      contents.removeByRemoteRequest(cid)
    })

    //  Get data channel state
    this.conference._jitsiConference?.addEventListener(JitsiMeetJS.events.conference.DATA_CHANNEL_OPENED, () => {
      this.conference.channelOpened = true
    })

    //  fragmented message
    this.conference.on(MessageType.FRAGMENT_HEAD, (from:string, msg:FragmentedMessageHead) => {
      this.fragmentedMessageHead = msg
      this.fragmentedMessages = []
    })
    this.conference.on(MessageType.FRAGMENT_CONTENT, (from:string, msg:FragmentedMessage) => {
      this.fragmentedMessages[msg.c] = msg
      if (this.fragmentedMessageHead.length && this.fragmentedMessages.length === this.fragmentedMessageHead.length
        && (this.fragmentedMessages.findIndex(msg => msg === undefined) === -1)) {
        let str = ''
        this.fragmentedMessages.forEach(msg => str += msg.s)
        //  console.log('JSON', str)
        const obj = JSON.parse(str)
        this.conference.emit(this.fragmentedMessageHead.type, from, obj)
        this.fragmentedMessageHead = {type:'', length:0}
        this.fragmentedMessages = []
      }
    })
  }
  unbind() {
    this.disposers.forEach(d => d())
  }

  //  Utilities
  private fragmentedMessages:FragmentedMessage[] = []
  private fragmentedMessageHead:FragmentedMessageHead = {type:'', length:0}
  sendFragmentedMessage(type: string, to: string, value: Object) {
    const str = JSON.stringify(value)
    const head: FragmentedMessageHead = {type, length:Math.ceil(str.length / FRAGMENTING_LENGTH)}
    this.conference.sendMessage(MessageType.FRAGMENT_HEAD, to, head)
    let count = 0
    for (let i = 0; i < str.length; i += FRAGMENTING_LENGTH) {
      this.conference.sendMessage(MessageType.FRAGMENT_CONTENT, to, {c:count, s:str.slice(i, i + FRAGMENTING_LENGTH)})
      count += 1
    }
  }
  private onParticipantLeft(id: string){
    contents.onParticipantLeft(id)
    chat.participantLeft(id)
    participants.leave(id)
  }
}
