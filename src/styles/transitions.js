import { StyleSheet } from 'aphrodite'

const opacity = 0.3
const transitionTime = '300ms'
const transition =`transform ${transitionTime} ease-in-out`

export default StyleSheet.create({
  slideRightEnter: {
    opacity,
    transform: 'translate(100%)',
  },
  slideRightEnterActive: {
    opacity,
    transition,
    transform: 'translate(0%)',
  },
  slideRightLeave: {
    opacity,
    transform: 'translate(0%)',
  },
  slideRightLeaveActive: {
    opacity,
    transition,
    transform: 'translate(-100%)',
  },
  slideLeftEnter: {
    opacity,
    transform: 'translate(-100%)',
  },
  slideLeftEnterActive: {
    opacity,
    transition,
    transform: 'translate(0%)',
  },
  slideLeftLeave: {
    opacity,
    transform: 'translate(0%)',
  },
  slideLeftLeaveActive: {
    opacity,
    transition,
    transform: 'translate(100%)',
  }
})
