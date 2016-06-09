import React from 'react'
import CircularProgress from 'material-ui/CircularProgress';

const styles = {
  container: {
    maxWidth: 800,
    margin: '24px auto'
  },
  withSidebar: {
    // because drawer is open
    marginLeft: '256px',

  }
}

// FIXME: This should probably just split up appbar and sidebar
export const AppPage = ({ navigation, content, loading, hideSidebar}) => (
  <div>
    { loading ? (
      <div className="row center-xs middle-xs">
        <CircularProgress />
      </div>
      ) : (
        <div>
          {navigation}
          <div style={hideSidebar ? {} : styles.withSidebar }>
            <div className="wrap container-fluid" style={styles.container}>
                <div className="row">
                  <div className='col-xs'>
                      <div className="box">
                         { content }
                      </div>
                  </div>
                </div>
            </div>
          </div>
        </div>
      )
    }
  </div>
)
