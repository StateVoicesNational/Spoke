import React from 'react'
import { StyleSheet, css } from 'aphrodite'
import theme from '../styles/theme'
import { withRouter } from 'react-router'

const styles = StyleSheet.create({
  container: {
    marginTop: '5vh',
    width: '80%',
    marginLeft: 'auto',
    marginRight: 'auto',
    fontSize: 14
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 12
  },
  paragraph: {
    marginBottom: 10
  },
  bigHeader: {
    ...theme.text.header,
    textAlign: 'center',
    fontSize: 40
  },
  header: {
    ...theme.text.header,
    marginTop: 20
  }
})

class Privacy extends React.Component {
  renderContent() {
    return (
      <div className={css(styles.container)}>
        <div className={css(styles.paragraph)}>
          Axle Factory, Inc. (“Axle Factory”) operates spoke.gearshift.co ("Spoke"). It is Axle Factory’s policy to respect your privacy regarding any information we may collect while operating Spoke.
        </div>
        <div className={css(styles.header)}>Website Visitors</div>
        <div className={css(styles.paragraph)}>
          Like most website operators, Axle Factory collects non-personally-identifying information of the sort that web browsers and servers typically make available, such as the browser type, language preference, referring site, and the date and time of each visitor request. Spoke’s purpose in collecting non-personally identifying information is to better understand how Spoke’s visitors use its website. From time to time, Axle Factory may release non-personally-identifying information in the aggregate, e.g., by publishing a report on trends in the usage of its website.
        </div>
        <div className={css(styles.paragraph)}>
          Axle Factory also collects potentially personally-identifying information like Internet Protocol (IP) addresses. Axle Factory does not use such information to identify its visitors, however, and does not disclose such information, other than under the same circumstances that it uses and discloses personally-identifying information, as described below.
        </div>
        <div className={css(styles.header)}>Information Gathering</div>
        <div className={css(styles.paragraph)}>
          We ask visitors who sign up for an account to provide a valid e-mail address. Those who engage in transactions with Spoke – by purchasing premium Spoke accounts, for example – are asked to provide additional information, including as necessary the personal and financial information required to process those transactions. In each case, Axle Factory collects such information only insofar as is necessary or appropriate to fulfill the purpose of the visitor’s interaction with Spoke. Axle Factory does not disclose personally-identifying information other than as described below. And visitors can always refuse to supply personally-identifying information, with the caveat that it may prevent them from engaging in certain website-related activities.
        </div>
        <div className={css(styles.header)}>Aggregated Statistics</div>
        <div className={css(styles.paragraph)}>
          Axle Factory may collect statistics about the behavior of visitors to its websites. For instance, Axle Factory may monitor the types of widgets most used in mockups made by visitors. Axle Factory may display this information publicly or provide it to others. However, Axle Factory does not disclose personally-identifying information other than as described below.
        </div>
        <div className={css(styles.header)}>Protection of Certain Personally-Identifying Information</div>
        <div className={css(styles.paragraph)}>
          Axle Factory discloses potentially personally-identifying and personally-identifying information only to those of its employees, contractors and affiliated organizations that (i) need to know that information in order to process it on Axle Factory’s behalf or to provide services available at Axle Factory’s websites, and (ii) that have agreed not to disclose it to others. Axle Factory will not rent or sell potentially personally-identifying and personally-identifying information to anyone, except in the following cases:
        </div>
        <ul>
          <li>when required to do so by law</li>
          <li>or when Axle Factory believes in good faith that disclosure is reasonably necessary to protect the property or rights of Axle Factory, third parties or the public at large.</li>
        </ul>
        <div className={css(styles.paragraph)}>
          If you are a registered user of Spoke and have supplied your email address, Axle Factory may occasionally send you an email to tell you about new features, solicit your feedback, or just keep you up to date with what’s going on with Spoke and our products. We expect to keep this type of email to a minimum. If you send us a request (for example via a support email or via one of our feedback mechanisms), we reserve the right to publish it in order to help us clarify or respond to your request or to help us support other users. Axle Factory takes all measures reasonably necessary to protect against the unauthorized access, use, alteration or destruction of potentially personally-identifying and personally-identifying information.
        </div>
        <div className={css(styles.header)}>Cookies</div>
        <div className={css(styles.paragraph)}>
          A cookie is a string of information that a website stores on a visitor’s computer, and that the visitor’s browser provides to the website each time the visitor returns. Axle Factory uses cookies to help Axle Factory identify and track visitors, their usage of Spoke’s website, and their website access preferences. Spoke visitors who do not wish to have cookies placed on their computers may set their browsers to refuse cookies before using Spoke, with the drawback that certain features of Spoke’s websites may not function properly without the aid of cookies.
        </div>
        <div className={css(styles.header)}>Privacy Policy Changes</div>
        <div className={css(styles.paragraph)}>
          Although most changes are likely to be minor, Axle Factory may change its Privacy Policy from time to time, and in Axle Factory’s sole discretion. Axle Factory encourages visitors to frequently check this page for any changes to its Privacy Policy. Your continued use of this site after any change in this Privacy Policy will constitute your acceptance of such change.
        </div>
      </div>
    )
  }

  render() {
    return (
      <div className={css(styles.container)}>
        <div className={css(styles.bigHeader)}>
          Spoke Privacy Policy
        </div>
        <div className={css(styles.subtitle)}>
          Last modified: July 28, 2016
        </div>
        <div className={css(styles.content)}>
          {this.renderContent()}
        </div>
      </div>
    )
  }
}

export default Privacy
