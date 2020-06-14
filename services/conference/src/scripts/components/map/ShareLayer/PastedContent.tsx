import {makeStyles} from '@material-ui/core/styles'
import React, {useRef, useEffect, useState} from 'react'
import {SharedContent as ISharedContent} from '@models/SharedContent'
import {subV, useGesture} from 'react-use-gesture'
import { default as participants } from '@stores/Participants'
import { Content } from './Content'

(global as any).mousePositionOnMap = [0, 0]

const useStyles = makeStyles({
  cont: (props: ISharedContent) => ({
    display: props.type==''? 'none' : 'block',
    position: 'absolute',
    borderStyle: 'solid',
    borderColor: 'orchid',
    borderWidth: '0.3em',
    left: `calc(${props.pose.position[0]}px - 0.3em)`,
    top: `calc(${props.pose.position[1]}px - 0.3em)`,
    transform:'rotate(' + props.pose.orientation + 'deg)',
  }),
})

var preciseOrientation = 0
export const PastedContent: React.FC = () => {
  const nullContent = {
    type:'', url:'',
    pose:{position:[0,0], orientation:0},
    size: [0,0]
  } as ISharedContent
  const [content, setContent] = useState(nullContent);
  const container = useRef<HTMLDivElement>(null)
  const bind = useGesture(
    {
      onDrag: ({down, delta, event, xy, buttons, ctrlKey, shiftKey}) => {
        //console.log("onDrag called d=", delta, " b=" , buttons)
        if (down) {
          event?.stopPropagation()
          event?.preventDefault()
          if (buttons === 2) {  // right mouse drag - rotate map
            preciseOrientation += delta[0] + delta[1];
            preciseOrientation %= 360;
            if (shiftKey || ctrlKey){
              content.pose.orientation = preciseOrientation;
            }else{
              content.pose.orientation = preciseOrientation - preciseOrientation % 15;
            }
          }else{
            for(var i=0; i<2; ++i) content.pose.position[i] += delta[i];
          }
          setContent(Object.assign({}, content))
        }
      },
      onContextMenu: event => event?.preventDefault(),
      onWheel: ({movement}) => {
        event?.preventDefault()
        event?.stopPropagation()
        let scale = Math.pow(1.2, movement[1] / 1000)
        var size :[number,number] = [content.size[0] * scale, content.size[1] * scale];
        if (20 < size[0] && size[0] < 10000 && 20 < size[1] && size[1] < 10000){
          var d = subV(size, content.size);
          content.size = size;
          for(var i=0; i<2; ++i) content.pose.position[i] -= d[i]/2;
        }
        setContent(Object.assign({}, content));
      },
    },
    {
      domTarget: container,
      eventOptions: {
        passive: false,
      }
    },
  )
  function onClick(evt: React.MouseEvent<HTMLInputElement>){
    console.log("onClick b:", evt.button, " bs:" ,evt.buttons, " d:", evt.detail, " p:", evt.eventPhase)
    if (evt.detail == 2){
      //  Add the pasted content to localPaticipant's contents and remove it.
      participants.local.get().addContent(content);
      setContent(nullContent);
    }
  }
  function onPaste(evt: ClipboardEvent){
    console.log("onPaste called")
    if (evt.clipboardData){
      if (evt.clipboardData.types.includes("Files")){   //  If file is pasted (an image is also a file)
        const imageFile = evt.clipboardData.items[0].getAsFile()
        if (imageFile){
          //  upload image file to Gayzo
          const formData = new FormData();
          formData.append('access_token', 'e9889a51fca19f2712ec046016b7ec0808953103e32cd327b91f11bfddaa8533')
          formData.append('imagedata', imageFile)
          fetch('https://upload.gyazo.com/api/upload', {method: 'POST', body: formData})
          .then((response) => response.json())
          .then((responseJson) => {
            //console.log("URL = " + responseJson.url)
            //  To do, add URL and ask user position to place the image
            var img = new Image();
            img.src = responseJson.url;
            img.onload = () => {
              content.size = [img.width, img.height]
              //console.log("mousePos:" + (global as any).mousePositionOnMap)
              content.pose.position = (global as any).mousePositionOnMap
              for(var i=0; i<2; ++i) content.pose.position[i] -= content.size[i]/2
              content.url = responseJson.url
              content.type = 'img'
              preciseOrientation = content.pose.orientation
              setContent(Object.assign({}, content))
            }
          })
          .catch((error) =>{
            console.error(error);
          });
        }
      }else if (evt.clipboardData.types.includes("text/plain")){
        evt.clipboardData.items[0].getAsString((str:string)=>{
          content.url = str
          if (content.url.indexOf('http://') === 0 || content.url.indexOf('https://') === 0){
            content.type = 'iframe'
            content.size[0] = 600;
            content.size[1] = 800;
          }else{
            content.type = 'text'
            content.pose.position = (global as any).mousePositionOnMap
            const slen = Math.sqrt(str.length)
            content.size[0] = slen*14*2;
            content.size[1] = slen*14/2;
          }
          setContent(Object.assign({}, content))
        })
      }
    }
  }
  useEffect(
    () => {
      bind()
      window.document.body.addEventListener(
        'paste',
        (event) => {
          onPaste(event)
          event.preventDefault()
        }
      )
    },
    [bind],
  )
  const classes = useStyles(content)
  return (
    <div className={classes.cont} ref={container} onClick = {onClick}>
    <Content content={content} />
    </div>
  )
}
