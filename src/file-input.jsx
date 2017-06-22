const React = require("react");

/* You know when you want to propagate input to a parent...
 * but then that parent does something with the input...
 * then changing the props of the input...
 * on every keystroke...
 * so if some input is invalid or incomplete...
 * the input gets reset or otherwise effed...
 *
 * This is the solution.
 *
 * Enough melodrama. Its an input that only sends changes
 * to its parent on blur.
 */
const FileInput = React.createClass({
    propTypes: {
        className: React.PropTypes.string,
        style: React.PropTypes.any,
        value: React.PropTypes.string.isRequired,
        onChange: React.PropTypes.func.isRequired,
    },
    getInitialState: function() {
        return {value: this.props.value};
    },
    componentWillReceiveProps: function(nextProps) {
        this.setState({value: nextProps.value});
    },
    handleChange: function(e) {
        var file    = e.target.files[0]; 
        var reader  = new FileReader();
        var that = this;
        reader.onloadend = function() {
            // console.log('RESULT', reader.result);
            // that.setState({value: reader.result});
            console.log(that);
            console.log(that.props);

            that.props.onChange(reader.result);
        }
        reader.readAsDataURL(file);

    },
    handleBlur: function(e) {
        // this.props.onChange(e.target.value);
    },
    render: function() {
        // var decodedData = window.atob(this.state.value);
        // var theFile = ""
        debugger;
        return <input
            className={this.props.className}
            style={this.props.style}
            type="file"
            // value={decodedData}
            value={this.state.value}
            onChange={this.handleChange}
            onBlur={this.handleBlur}
        />
        ;
        
    },
});



module.exports = FileInput;
