
let subdomain = ''
if (subdomain) {
  subdomain = subdomain.substr(0, subdomain.length - 1).split('.').join('_').toLowerCase() + '.'
}
export const config = {
  hosts: {
      domain: 'beta.meet.jit.si',

      muc: 'conference.beta.meet.jit.si', // FIXME: use XEP-0030
      focus: 'focus.beta.meet.jit.si',
    },
  disableSimulcast: false,
  enableRemb: true,
  enableTcc: true,
  resolution: 720,
  constraints: {
      video: {
          height: {
              ideal: 720,
              max: 720,
              min: 180,
            },
          width: {
              ideal: 1280,
              max: 1280,
              min: 320,
            },
        },
    },
  externalConnectUrl: '//beta.meet.jit.si/http-pre-bind',
  analytics: {
      amplitudeAPPKey: 'fafdba4c3b47fe5f151060ca37f02d2f',
      whiteListedEvents: ['conference.joined', 'page.reload.scheduled', 'rejoined', 'transport.stats'],
    },
  enableP2P: true, // flag to control P2P connections
    // New P2P options
  p2p: {
      enabled: true,
      preferH264: true,
      disableH264: true,
      useStunTurn: true, // use XEP-0215 to fetch STUN and TURN servers for the P2P connection
    },
  useStunTurn: true, // use XEP-0215 to fetch TURN servers for the JVB connection
  useIPv6: false, // ipv6 support. use at your own risk
  useNicks: false,
  bosh: 'https://beta.meet.jit.si/http-bind', // FIXME: use xep-0156 for that
  websocket: 'wss://beta.meet.jit.si/xmpp-websocket', // FIXME: use xep-0156 for that


  clientNode: 'http://jitsi.org/jitsimeet', // The name of client node advertised in XEP-0115 'c' stanza
    // deprecated desktop sharing settings, included only because older version of jitsi-meet require them
  desktopSharing: 'ext', // Desktop sharing method. Can be set to 'ext', 'webrtc' or false to disable.
  chromeExtensionId: 'kglhbbefdnlheedjiejgomgmfplipfeb', // Id of desktop streamer Chrome extension
  desktopSharingSources: ['screen', 'window'],
  googleApiApplicationClientID: '39065779381-bbhnkrgibtf4p0j9ne5vsq7bm49t1tlf.apps.googleusercontent.com',
  microsoftApiApplicationClientID: '00000000-0000-0000-0000-000040240063',
  enableCalendarIntegration: true,
    // new desktop sharing settings
  desktopSharingChromeExtId: 'kglhbbefdnlheedjiejgomgmfplipfeb', // Id of desktop streamer Chrome extension
  desktopSharingChromeDisabled: false,
  desktopSharingChromeSources: ['screen', 'window', 'tab'],
  desktopSharingChromeMinExtVersion: '0.2.6.2', // Required version of Chrome extension
  desktopSharingFirefoxExtId: '',
  desktopSharingFirefoxDisabled: false,
  desktopSharingFirefoxMaxVersionExtRequired: '0',
  desktopSharingFirefoxExtensionURL: '',
  useRoomAsSharedDocumentName: false,
  enableLipSync: false,
  disableRtx: false, // Enables RTX everywhere
  enableRtpStats: false, // Enables RTP stats processing
  enableScreenshotCapture: false,
  enableStatsID: true,
  openBridgeChannel: 'websocket', // One of true, 'datachannel', or 'websocket'
  channelLastN: -1, // The default value of the channel attribute last-n.
  minHDHeight: 540,
  startBitrate: '800',
  disableAudioLevels: false,
  useRtcpMux: true,
  useBundle: true,
  disableSuspendVideo: true,
  stereo: false,
  forceJVB121Ratio: -1,
  enableTalkWhileMuted: true,

  enableNoAudioDetection: true,

  enableNoisyMicDetection: true,

  enableClosePage: true,

  hiddenDomain: 'recorder.meet.jit.si',
  dropbox: {
      appKey: '3v5iyto7n7az02w',
    },
  transcribingEnabled: false,
  enableRecording: true,
  liveStreamingEnabled: true,
  fileRecordingsEnabled: true,
  fileRecordingsServiceEnabled: false,
  fileRecordingsServiceSharingEnabled: false,
  requireDisplayName: false,
  recordingType: 'jibri',
  enableWelcomePage: true,
  isBrand: false,
  logStats: false,
  dialInNumbersUrl: 'https://api.jitsi.net/phoneNumberList',
  dialInConfCodeUrl: 'https://api.jitsi.net/conferenceMapper',

  dialOutCodesUrl: 'https://api.jitsi.net/countrycodes',
  dialOutAuthUrl: 'https://api.jitsi.net/authorizephone',
  peopleSearchUrl: 'https://api.jitsi.net/directorySearch',
  inviteServiceUrl: 'https://api.jitsi.net/conferenceInvite',
  inviteServiceCallFlowsUrl: 'https://api.jitsi.net/conferenceinvitecallflows',
  peopleSearchQueryTypes: ['user', 'conferenceRooms'],
  startAudioMuted: 9,
  startVideoMuted: 9,
  enableUserRolesBasedOnToken: false,
  enableLayerSuspension: false,
  feedbackPercentage: 0,
  chromeExtensionBanner: {
      url: 'https://chrome.google.com/webstore/detail/jitsi-meetings/kglhbbefdnlheedjiejgomgmfplipfeb',
      chromeExtensionsInfo: [{path: 'jitsi-logo-48x48.png', id: 'kglhbbefdnlheedjiejgomgmfplipfeb'}],
    },
  hepopAnalyticsUrl: '',
  hepopAnalyticsEvent: {
      product: 'lib-jitsi-meet',
      subproduct: 'meet-jit-si',
      name: 'jitsi.page.load.failed',
      action: 'page.load.failed',
      actionSubject: 'page.load',
      type: 'page.load.failed',
      source: 'page.load',
      attributes: {
          type: 'operational',
          source: 'page.load',
        },
      server: 'meet.jit.si',
    },
  deploymentInfo: {
      environment: 'meet-jit-si',
      envType: 'prod',
      releaseNumber: '631',
      shard: 'meet-jit-si-ap-se-1b-s107',
      region: 'ap-southeast-1',
      userRegion: 'ap-southeast-1',
      crossRegion: (!'ap-southeast-1' || 'ap-southeast-1' === 'ap-southeast-1') ? 0 : 1,
    },
  rttMonitor: {
      enabled: false,
      initialDelay: 30000,
      getStatsInterval: 10000,
      analyticsInterval: 60000,
      stunServers: {'us-east-1': 'all-us-east-1-turn.jitsi.net:443', 'ap-se-2': 'all-ap-se-2-turn.jitsi.net:443', 'ap-se-1': 'all-ap-se-1-turn.jitsi.net:443', 'us-west-2': 'all-us-west-2-turn.jitsi.net:443', 'eu-central-1': 'all-eu-central-1-turn.jitsi.net:443', 'eu-west-1': 'all-eu-west-1-turn.jitsi.net:443'},
    },
  e2eping: {
      pingInterval: -1,
    },
  abTesting: {
    },
  testing: {
      capScreenshareBitrate: 1,
      octo: {
          probability: 1,
        },
    },
}