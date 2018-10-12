import { configure } from 'enzyme'
import Adapter from 'enzyme-adapter-react-15'
import 'babel-polyfill'


configure({ adapter: new Adapter() })
