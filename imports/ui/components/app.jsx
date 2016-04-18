// // App component - represents the whole app
// class App extends Component {
//   constructor(props) {
//     super(props);

//     this.state = {
//       uploading: false,
//     };
//   }

//   handleUpload(event) {
//     event.preventDefault();
//     Papa.parse( event.target.files[0], {
//       header: true,
//       beforeFirstChunk: function(chunk) {
//         var rows = chunk.split( /\r\n|\r|\n/ );
//         var headings = rows[0].toLowerCase();
//         rows[0] = headings;
//         return rows.join("\r\n");
//       },
//       complete( results, file ) {
//         Meteor.call( 'tasks.parseUpload', results, ( error, response ) => {
//           if ( error ) {
//             console.log("error saving")
//           } else {
//             console.log(results.meta)
//             console.log("called tasks.parseUploadt")
//             // Handle success here.
//           }
//         });

//       }
//     });

//   }
//   handleSubmit(event) {
//     event.preventDefault();

//     // Find the text field via the React ref
//     const text = ReactDOM.findDOMNode(this.refs.textInput).value.trim();

//     Tasks.insert({
//       text,
//       createdAt: new Date(), // current time
//     });

//     // Clear form
//     ReactDOM.findDOMNode(this.refs.textInput).value = '';
//   }

//   renderTasks() {
//     return this.props.tasks.map((task) => (
//       <Task key={task._id} task={task} />
//     ));
//   }

//   render() {
//     // <form className="new-task" onSubmit={this.handleSubmit.bind(this)}>
//     //   <input
//     //     type="text"
//     //     ref="textInput"
//     //     placeholder="Type to add new tasks"
//     //   />

//     // </form>
//     return (
//       <div className="container">
//         <h4 class="page-header">Upload a CSV</h4>
//         <input type="file" name="uploadCSV" onChange={this.handleUpload.bind(this)}></input>



//         <header>
//           <h1>TEXTING</h1>
//         </header>

//         <ul>
//           {this.renderTasks()}
//         </ul>
//       </div>
//     );
//   }
// }

// App.propTypes = {
//   tasks: PropTypes.array.isRequired,
// };

// export default createContainer(() => {
//   return {
//     tasks: Tasks.find({}, { sort: { createdAt: -1 } }).fetch(),
//   };
// }, App);