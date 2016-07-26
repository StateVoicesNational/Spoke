import React from 'react'
import { StyleSheet, css } from 'aphrodite'
import theme from '../styles/theme'

const styles = StyleSheet.create({
  header: theme.text.header,
  secondaryHeader: theme.text.body,
  container: {
    marginBottom: 20
  }
})

const CampaignFormSectionHeading = ({ title, subtitle }) => (
  <div className={css(styles.container)}>
    <div className={css(styles.header)}>{title}</div>
    <div className={css(styles.secondaryHeader)}>{subtitle}</div>
  </div>
)

CampaignFormSectionHeading.propTypes = {
  title: React.PropTypes.string,
  subtitle: React.PropTypes.any
}

export default CampaignFormSectionHeading
