var React = require("react");
var ReactDOM = require("react-dom");
var _ = require("underscore");

import ImageLoader from './imageLoader.jsx';

var textWidthCache = {};
function getTextWidth(text) {
    if (!textWidthCache[text]) {
        // Hacky way to guess the width of an input box
        var $test = $("<span>").text(text).appendTo("body");
        textWidthCache[text] = $test.width() + 20;
        $test.remove();
    }
    return textWidthCache[text];
}


var TextListEditor = React.createClass({
    propTypes: {
        options: React.PropTypes.array,
        layout: React.PropTypes.string,
        onChange: React.PropTypes.func.isRequired
    },

    getDefaultProps: function() {
        return {
            options: [],
            layout: "horizontal"
        };
    },

    getInitialState: function() {
        return {
            items: this.props.options.concat("")
        };
    },

    componentWillReceiveProps: function(nextProps) {
        this.setState({
            items: nextProps.options.concat("")
        });
    },

    render: function() {
        var className = [
            "perseus-text-list-editor",
            "ui-helper-clearfix",
            "layout-" + this.props.layout
        ].join(" ");

        var inputs = _.map(this.state.items, function(item, i) {
            const imageInItem = /!\[.*\]\(([^\)]*)\)/.exec(item);
            return (
                <div key={i}>
                    <li key={i}>
                        <input
                            ref={"input_" + i}
                            type="text"
                            value={item}
                            onChange={this.onChange.bind(this, i)}
                            onKeyDown={this.onKeyDown.bind(this, i)}
                            style={{width: getTextWidth(item)}}
                        />
                    </li>
                    <ImageLoader
                        setUrl={this.setUrl(i).bind(this)}
                        clearUrl={this.clearUrl(i).bind(this)}
                        editorMode={true}
                        originImage={imageInItem ? imageInItem[1] : ''}
                    />
                </div>
            );
        }, this);

        return <ul className={className}>{inputs}</ul>;
    },

    setUrl: function(index) {
        return function(url) {
            const inputElement = ReactDOM.findDOMNode(this.refs[`input_${index}`]);
            const focusIndex = inputElement.selectionStart;
            const valueLength = inputElement.value.length;
            this.onChange(index,
                {
                    target: {
                        value: `${inputElement.value.substring(0, focusIndex)}![](${url})${inputElement.value.substring(focusIndex, valueLength)}`
                    }
                }
            );
            this.disableInput(index, true);
        };
    },

    clearUrl: function(index) {
        return function(url) {
            const inputElement = ReactDOM.findDOMNode(this.refs[`input_${index}`]);
            const urlIndex = inputElement.value.indexOf(`![](${url})`);
            const urlLength = `![](${url})`.length;
            this.onChange(index,
                {
                    target: {
                        value: `${inputElement.value.substring(0, urlIndex)}${inputElement.value.substring(urlIndex + urlLength, inputElement.value.length)}`
                    }
                }
            );
            this.disableInput(index, false);
        };
    },

    disableInput: function(index, disabled) {
        const inputElement = ReactDOM.findDOMNode(this.refs[`input_${index}`]);
        inputElement.disabled = disabled;
    },

    onChange: function(index, event) {
        var items = _.clone(this.state.items);
        items[index] = event.target.value;

        if (index === items.length - 1) {
            items = items.concat("");
        }

        this.setState({items: items});
        this.props.onChange(_.compact(items));
    },

    onKeyDown: function(index, event) {
        var which = event.nativeEvent.keyCode;

        // Backspace deletes an empty input...
        if (which === 8 /* backspace */ && this.state.items[index] === "") {
            event.preventDefault();

            var items = _.clone(this.state.items);
            var focusIndex = (index === 0) ? 0 : index - 1;

            if (index === items.length - 1 &&
                    (index === 0 || items[focusIndex] !== "")) {
                // ...except for the last one, iff it is the only empty
                // input at the end.
                ReactDOM.findDOMNode(this.refs["input_" + focusIndex]).focus();
            } else {
                items.splice(index, 1);
                this.setState({items: items}, function() {
                    ReactDOM.findDOMNode(this.refs["input_" + focusIndex]).focus();
                });
            }

        // Deleting the last character in the second-to-last input removes it
        } else if (which === 8 /* backspace */ &&
                this.state.items[index].length === 1 &&
                index === this.state.items.length - 2) {
            event.preventDefault();

            var items = _.clone(this.state.items);
            items.splice(index, 1);
            this.setState({items: items});
            this.props.onChange(_.compact(items));

        // Enter adds an option below the current one...
        } else if (which === 13 /* enter */) {
            event.preventDefault();

            var items = _.clone(this.state.items);
            var focusIndex = index + 1;

            if (index === items.length - 2) {
                // ...unless the empty input is just below.
                ReactDOM.findDOMNode(this.refs["input_" + focusIndex]).focus();
            } else {
                items.splice(focusIndex, 0, "");
                this.setState({items: items}, function() {
                    ReactDOM.findDOMNode(this.refs["input_" + focusIndex]).focus();
                });
            }
        }
    }
});

module.exports = TextListEditor;
