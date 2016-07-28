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

class Terms extends React.Component {
  renderContent() {
    return (
      <div className={css(styles.container)}>
        <div className={css(styles.paragraph)}>
          Welcome to Spoke, a manual texting web-based application. The following terms and conditions govern all use of Spoke and all content, services and products available at or through the gearshift.co website (the “Site”) (taken together, the “Service”). The Service is owned and operated by Axle Factory (“Axle Factory”). The Service is offered subject to your acceptance without modification of all of the terms and conditions contained herein and all other operating rules, policies and procedures that may be published from time to time on the Site (collectively, the “Agreement”).
        </div>
        <div className={css(styles.header)}>Acceptance of Terms</div>
        <div className={css(styles.paragraph)}>
          By accessing or using any part of the Service, you agree to become bound by the terms and conditions of this agreement. “You” as used herein refers to the individual, company or organization executing this service agreement, together with their or its employees, agents and other representatives, including, without limitation, any volunteers. If you do not agree to all the terms and conditions of this agreement, then you may not access or use the Service. If these terms and conditions are considered an offer by Axle Factory, acceptance is expressly limited to these terms.
        </div>
        <div className={css(styles.header)}>Description of Service</div>
        <div className={css(styles.paragraph)}>
          The Service is a manual text only platform that is capable of dialing a phone number and sending a text message if, and only if, an individual user manually chooses to send a text message. “Text message” as used herein refers to an electronic communication sent or received over a cellular network from one cellular phone to another, including without limitation, communication that includes typed characters, pictures, other multimedia characters, and/or voice recordings. The Service does not have the capacity to dial or text phone numbers without human intervention and is expressly not intended to be used to automatically dial or text phone numbers without human intervention. The Service is available only to individuals who are at least 13 years old. In order to use the Service, you must obtain access to the Internet, and you are responsible for obtaining and paying for any equipment or services necessary for such access. You agree only to access and use the Service in ways provided by Axle Factory for accessing and using the Service. Without limiting the foregoing, you agree that you will not alter or otherwise reconfigure the Service in any way, including without limitation, altering, reconfiguring, programming or scripting the Service to permit automatic dialling or automatic texting. Axle Factory reserves the right to modify or discontinue the Service at any time for any reason. Axle Factory shall not be liable to you or to any third party for any modification, price change, suspension or discontinuance of the Service.
        </div>
        <div className={css(styles.header)}>Accounts</div>
        <div className={css(styles.paragraph)}>
          To create an account with the Service, you must provide Axle Factory with a valid email address and a password for your account as well as any other required information on the sign up form. You are responsible for maintaining the security of your account with the Service, and you are fully responsible for any use of the account and all activities that occur under the account. You will immediately notify Axle Factory of any unauthorized uses of your account or any other breaches of security. Axle Factory will not be liable for any acts or omissions by you, including any damages of any kind incurred as a result of such acts or omissions.
        </div>
        <div className={css(styles.header)}>Content</div>
        <div className={css(styles.paragraph)}>
          <div className={css(styles.paragraph)}>
            If you create an account, upload material (including, without limitation, any personal information, contact information or phone numbers) to the Service, share material using the Service, or otherwise make (or allow any third party to make) material available by means of the Service (any such material, “Content”), you are entirely responsible for the content of, and any harm resulting from, that Content. By making Content available, you represent and warrant that:
          </div>
          <ul>
            <li>all phone numbers included in the Content are obtained, provided and maintained in compliance with all applicable federal, state and local laws, including without limitation all applicable TCPA, FDCPA and FCC regulations and restrictions;</li>
            <li>use of the Content will not infringe the proprietary rights, including but not limited to the copyright, patent, trademark or trade secret rights, of any third party;</li>
            <li>you have fully complied with all applicable laws, including if applicable any third-party licenses, relating to the Content, and have done all things necessary to successfully pass through to end users any required terms.</li>
          </ul>
          <div className={css(styles.paragraph)}>
          You understand that, as a result of the processing and transmission of your Content by the Service, your Content may be transferred unencrypted.
          </div>
          <div className={css(styles.paragraph)}>
            Axle Factory does not claim ownership over any Content you upload to the Service. Axle Factory is not responsible for your Content or for its use or effects. You are responsible for backing up any Content that is uploaded; Content that is older than 30 days may not be accessible.
          </div>
          <div className={css(styles.paragraph)}>
            By operating the Service, Axle Factory does not represent or imply that it endorses the Content created or shared by users of the Service, or that it believes such Content to be accurate, useful or non-harmful. The Service may also contain Content uploaded by others that violates the privacy or publicity rights, or infringes the intellectual property and other proprietary rights, of third parties, or the downloading, copying or use of which is subject to additional terms and conditions, stated or unstated. Axle Factory disclaims any responsibility for any harm resulting from the use by visitors of the Service (e.g. visitors who do not have an account but are viewing a shared project).  Axle Factory shall not share any Content with third parties, except and solely to the extent as required by applicable law.
          </div>
        </div>
        <div className={css(styles.className)}>Fees and Payment</div>
        <div className={css(styles.paragraph)}>
          <div className={css(styles.paragraph)}>
            The fees and billing cycle for the Service are explained in the pricing plan selection form. By your selection of a particular plan in this form, you agree to pay Axle Factory the monthly or annual subscription fees indicated for that plan. The time at which payments will be charged are indicated in the pricing form, and in cases where the payment cannot be billed directly from a payment instrument on file, all invoices must be paid in full within 14 days of the date of invoice. Service fees are not refundable.
          </div>
          <div className={css(styles.paragraph)}>
            Axle Factory expressly reserves the right to change or modify its prices and fees at any time with 30 days' notice. Your continued use of the Service after any price change indicates your agreement with the new fees and charges after the effective date of the change.
          </div>
        </div>
        <div className={css(styles.header)}>Proprietary Rights</div>
        <div className={css(styles.paragraph)}>
          <div className={css(styles.paragraph)}>
            Axle Factory does not claim ownership over any Content you upload to the Service. All Content you create or upload using the Service is yours, but you understand that your Content is viewable by any others who you grant access to view your content by adding them to a Campaign or to your Organization.
          </div>
          <div className={css(styles.paragraph)}>
            You agree that Axle Factory owns the intellectual property rights to the Service and any software connected with the Service along with any protectable components of the Service. This Agreement does not transfer from Axle Factory to you any Axle Factory or third party intellectual property, and all right, title and interest in and to such property will remain (as between the parties) solely with Axle Factory. You agree not to duplicate, modify, copy, rent, lease, loan, adapt, reproduce, resell, or create derivative works based on any component of the Service without express written permission by Axle Factory.
          </div>
          <div className={css(styles.paragraph)}>
            This Agreement does not transfer to you the right or license to reproduce or otherwise use trademarks, service marks, graphics, domain names, or logos associated with Axle Factory, Spoke, Gearshift, Gearshift.co, Axle Factory’s brand, or the Service. Other trademarks, service marks, graphics and logos used in connection with the Service may be the trademarks of other third parties. Your use of the Service grants you no right or license to reproduce or otherwise use these third-party trademarks.
          </div>
        </div>
        <div className={css(styles.header)}>Changes</div>
        <div className={css(styles.paragraph)}>
          Axle Factory reserves the right, at its sole discretion, to modify or replace any part of this Agreement. It is your responsibility to check this Agreement periodically for changes. If we believe that the changes are material, we’ll definitely let you know by doing one (or more) of the following: (1) posting the changes through the Service or (2) sending you an email or message about the changes. Your continued use of or access to the Service following the posting of any changes to this Agreement constitutes acceptance of those changes. Axle Factory may also, in the future, offer new services and/or features through the Service, including, the release of new tools and resources, provided that Axle Factory shall not alter or reconfigure the Service to permit auto-dialing or auto-texting. Such new features and/or services shall be subject to the terms and conditions of this Agreement.
        </div>
        <div className={css(styles.header)}>Termination</div>
        <div className={css(styles.paragraph)}>
          Axle Factory may terminate your access to all or any part of the Service, including but not limited to any Content within the Service, at any time, with or without cause, with or without notice, effective immediately. If you wish to terminate this Agreement or your account, you may simply discontinue using the Service, provided that you shall remain liable for all outstanding fees for services rendered. All provisions of this Agreement which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity and limitations of liability.
        </div>
        <div className={css(styles.header)}>Disclaimer of Warranties</div>
        <div className={css(styles.paragraph)}>
          The Service is provided “as is”. Axle Factory and its suppliers and licensors hereby disclaim all warranties of any kind, express or implied, including, without limitation, the warranties of merchantability, fitness for a particular purpose and non-infringement. Neither Axle Factory nor its suppliers and licensors, makes any warranty that the Service will be error free or that access thereto will be continuous or uninterrupted. You understand that you obtain content or services through the Service at your own discretion and risk.
        </div>
        <div className={css(styles.header)}>Limitation of Liability</div>
        <div className={css(styles.paragraph)}>
          In no event will Axle Factory, or its suppliers or licensors, be liable with respect to any subject matter of this Agreement under any contract, negligence, strict liability or other legal or equitable theory for: (i) any special, incidental, consequential or punitive damages including loss of use, profits, revenue or goodwill; (ii) the cost of procurement or substitute products or services; (iii) for interruption of use or loss or corruption of data including Content; or (iv) for any amounts that exceed the fees paid by you to Axle Factory under this agreement during the twelve (12) month period prior to the cause of action. Axle Factory shall have no liability for any failure or delay due to matters beyond their reasonable control. Without limiting the foregoing, while Axle Factory shall use commercially reasonable efforts to maintain an up-to-date area code and time zone database, you agree not to hold Axle Factory liable for any direct or incidental liability resulting from inaccuracies in time zone programming that are not due to gross negligence by Axle Factory. The foregoing shall not apply to the extent prohibited by applicable law.
        </div>
        <div className={css(styles.header)}>General Representation and Warranty</div>
        <div className={css(styles.paragraph)}>
          You represent and warrant that (i) your use of the Service will be in strict accordance with the Axle Factory Privacy Policy, with this Agreement and with all applicable laws and regulations (including without limitation any federal, state or local laws or regulations in your country, state, city, or other governmental area, regarding online conduct and acceptable content and use of personal information, contact information and phone numbers (including without limitation, all applicable TCPA, FDCPA and FCC regulations and restrictions and all applicable federal, state and local restrictions regarding permissible timing for electronic communications), all applicable laws regarding the transmission of technical data exported from the United States or the country in which you reside and all applicable laws relating to your business and purposes in using the Services) and (ii) your use of the Service will not infringe or misappropriate the intellectual property rights of any third party.
        </div>
        <div className={css(styles.header)}>Indemnification</div>
        <div className={css(styles.paragraph)}>
          You agree to indemnify and hold harmless Axle Factory, its contractors, and its licensors, and their respective directors, officers, employees and agents from and against any and all claims and expenses, including attorneys’ fees, arising out of your use of the Service, including but not limited to your violation of this Agreement.
        </div>
        <div className={css(styles.header)}>Miscellaneous</div>
        <div className={css(styles.paragraph)}>
          This Agreement constitutes the entire agreement between you and Axle Factory concerning your use of the Service and may only be modified by a written amendment signed by an authorized executive of Axle Factory, or by the posting by Axle Factory of a revised version on the Site. If any part of this Agreement is held invalid or unenforceable, that part will be construed to reflect the parties’ original intent, and the remaining portions will remain in full force and effect. A waiver by either party of any term or condition of this Agreement or any breach thereof, in any one instance, will not waive such term or condition or any subsequent breach thereof. You may assign your rights under this Agreement to any party that consents to, and agrees to be bound by, its terms and conditions; Axle Factory may assign its rights under this Agreement without condition. This Agreement will be binding upon and will inure to the benefit of the parties, their successors and permitted assigns.
        </div>
      </div>
    )
  }

  render() {
    return (
      <div className={css(styles.container)}>
        <div className={css(styles.bigHeader)}>
          Spoke Terms of Service
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

export default Terms
