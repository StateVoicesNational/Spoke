import React from 'react'
import { StyleSheet, css } from 'aphrodite'
import theme from '../styles/theme'

const styles = StyleSheet.create({
  container: {
    marginTop: '5vh',
    textAlign: 'center',
    color: theme.colors.lightGray
  },
  content: {
    ...theme.layouts.greenBox,
    color: theme.colors.lightGray
  },
  bigHeader: {
    ...theme.text.header,
    fontSize: 40
  },
  header: {
    ...theme.text.header,
    marginBottom: 15,
    color: theme.colors.white
  },
  link: {
    ...theme.text.link
  },
  detailItem: {

  },
  details: {
    textAlign: 'left',
    width: '40%',
    borderTop: '1px solid white',
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingTop: 15
  }
})

export default () => (
  <div className={css(styles.container)}>
    <div className={css(styles.bigHeader)}>
      Spoke - Pricing
    </div>
    <div className={css(styles.content)}>
      <div className={css(styles.header)}>
        $0.06 per outbound message.
      </div>
      <div className={css(styles.details)}>
        <div>
        Unlimited texters.
        </div>
        <div>
        No charge for inbound messages.
        </div>
        <div>
        Pay as you go.
        </div>
        <div>
        Try it out with 50 free messages. No credit card required.
        </div>
      </div>
    </div>
  </div>
)
