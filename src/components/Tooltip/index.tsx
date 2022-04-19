import React, { useEffect, useMemo, useRef } from 'react';
// import ReactDOM from "react-dom";
// import Animate from './../../helpers/requestAnimationFrame';
// import { useTransition } from "./../../hook/index";
import './style.less';
import ReactDOM from "react-dom";

type EPlacement = 'left' | 'top' | 'right' | 'bottom' | 'center';
type EEventType = 'click' | 'mouse'
type IOffset = {
  x: number
  y: number
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}
type IProps = {
  trigger: EEventType // 事件触发类型
  popup: React.ReactNode // 提示组件
  placement?: EPlacement[] // 提示方位
  [key: string]: any
}

// 当未配置[placement]时,根据当前屏幕相对位置,进行默认定位
function autoDirection(targetOffset: IOffset): EPlacement[] {
  let direction: EPlacement[] = [];
  const origin = {
    x: targetOffset.left + (targetOffset.width / 2),
    y: targetOffset.top + (targetOffset.top / 2)
  }
  const docOrigin = {
    x: document.body.clientWidth / 2,
    y: document.body.clientHeight / 2,
  }
  // 1向限
  if (origin.x < docOrigin.x && origin.y < docOrigin.y) {
    direction = ['right', 'top'];
  }
  // 2向限
  if (origin.x > docOrigin.x && origin.y < docOrigin.y) {
    direction = ['left', 'top'];
  }
  // 3向限
  if (origin.x > docOrigin.x && origin.y > docOrigin.y) {
    direction = ['left', 'bottom'];
  }
  // 4向限
  if (origin.x < docOrigin.x && origin.y > docOrigin.y) {
    direction = ['right', 'bottom'];
  }
  // 中心点
  if (origin.x === docOrigin.x && origin.y === docOrigin.y) {
    direction = ['bottom'];
  }
  return direction;
}

// 根据定位,计算相对偏移量
function computeOffset(direction: EPlacement[], targetOffset: IOffset, floatOffset: IOffset): IOffset {
  floatOffset.left = targetOffset.left;
  floatOffset.top = targetOffset.top;

  if (direction.length !== 0 && direction[0] === direction[1]) {
    throw new Error('nicetoolfn => Tooltip => placement:位置不允许重复')
  }
  if (direction[0] === 'center') {
    throw new Error('nicetoolfn => Tooltip => placement:["center"]不可为数组索引0的值')
  }
  if (direction[0] !== undefined && [1] === undefined) {
    direction[1] = 'center'
  }
  if (direction.length === 0) {
    direction = autoDirection(targetOffset);
  }

  for (let i = 0; i < direction.length; i++) {
    const key = direction[i];
    switch (key) {
      case "left":
        floatOffset.left = [
          floatOffset.left - floatOffset.width,
          floatOffset.left
        ][i];
        break;
      case 'right':
        floatOffset.left = [
          floatOffset.left + targetOffset.width,
          floatOffset.left - (floatOffset.width - targetOffset.width)
        ][i];
        break
      case 'top':
        floatOffset.top = [
          floatOffset.top - floatOffset.height,
          floatOffset.top
        ][i];
        break
      case 'bottom':
        floatOffset.top = [
          floatOffset.top + targetOffset.height,
          floatOffset.top - floatOffset.height + targetOffset.height
        ][i];
        break
      case 'center':
        if (['left', 'right'].includes(direction[0])) {
          floatOffset.top = floatOffset.top - (floatOffset.height / 2) + (targetOffset.height / 2)
        }
        if (["top", "bottom"].includes(direction[0])) {
          floatOffset.left = floatOffset.left - (floatOffset.width / 2) + (targetOffset.width / 2)
        }
        break
    }
  }
  return floatOffset
}

console.log(computeOffset);

export default function (props: IProps) {
  const PopupRoot = useMemo(() => {
    return document.getElementById('nicetoolfn-tooltip') || (() => {
      const div = document.createElement('div')
      div.setAttribute('id', 'nicetoolfn-tooltip');
      div.style.position = 'absolute';
      div.style.left = '0';
      div.style.top = '0';
      div.style.width = '0';
      div.style.height = '0';
      document.body.appendChild(div);
      return div
    })();
  }, []);
  const refRoot = useRef<HTMLElement>();
  const refPopup = useRef<HTMLElement>();
  const refShow = useRef<Boolean>(false);

  const Popup = () => {
    let Component = props.popup;
    Component = typeof Component === 'function' ? <Component/> : Component;
    Component = React.createElement('div', {
      ...(Component as React.ReactElement).props,
      ref: refPopup
    }, [Component]);
    return Component
  };
  const Root = () => {
    let Root = React.Children.only(props.children);
    const { trigger } = props;
    const event = {
      click: {
        onClick: onClickEvent
      },
      mouse: {
        onMouseOver: () => {
        },
        onMouseLeave: () => {
        }
      }
    }[trigger];

    Root = React.cloneElement(Root, {
      ...Root.props,
      ...event,
      ref: refRoot
    })

    return Root;
  }

  const onClickEvent = () => {
    console.log('refShow', refShow);
  }

  useEffect(() => {
    if (!refRoot.current || !refPopup.current) {
      return;
    }

    const { x, y }: IOffset = refRoot.current!.getBoundingClientRect();
    refPopup.current!.style.position = 'absolute';
    refPopup.current!.style.left = x + 'px';
    refPopup.current!.style.top = y + 'px';
    refPopup.current!.style.transform = 'translateX(-50%) translateY(-50%)';
  }, []);

  return <>
    {Root()}
    {ReactDOM.createPortal(
      Popup(),
      PopupRoot
    )}
  </>
}
