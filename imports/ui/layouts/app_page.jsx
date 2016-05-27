import React from 'react'
import CircularProgress from 'material-ui/CircularProgress';

const styles = {
  container: {
    maxWidth: 800,
    margin: '24px auto'
  },
  content: {
    // because drawer is open
    marginLeft: '256px',

  }
}

export const AppPage = ({ navigation, content, loading}) => (
  <div>
    { loading ? '' : navigation }
    <div style={styles.content}>
      <div className="wrap container-fluid" style={styles.container}>
        <div className="row">
          <div className={`col-xs ${ loading ? ' center-xs' : ''}`}>
              <div className="box">
                { loading ? <CircularProgress /> : content }
              </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)
