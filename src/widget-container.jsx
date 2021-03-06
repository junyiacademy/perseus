var React = require('react');
var classNames = require("classnames");

var WidgetContainer = React.createClass({
    propTypes: {
        shouldHighlight: React.PropTypes.bool,
        type: React.PropTypes.func,
        initialProps: React.PropTypes.object.isRequired,
    },

    render: function() {
        var className = classNames({
            "perseus-widget-container": true,
            "widget-highlight": this.props.shouldHighlight,
            "widget-nohighlight": !this.props.shouldHighlight,
        });

        var WidgetType = this.props.type;
        if (WidgetType == null) {
            // Just give up on invalid widget types
            return <div className={className} />;
        }

        return <div className={className}
            style={WidgetType.displayMode ? {
                display: WidgetType.displayMode
            } : {}}>
            <WidgetType {...this.props.initialProps} ref="widget" />
        </div>;
    },

    getWidget: function() {
        return this.refs.widget;
    },
});

module.exports = WidgetContainer;
