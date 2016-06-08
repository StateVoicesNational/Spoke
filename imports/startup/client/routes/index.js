import injectTapEventPlugin from 'react-tap-event-plugin'
// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin()

import './adminRoutes'
import './appRoutes'
import './publicRoutes'


FlowRouter.initialize();
