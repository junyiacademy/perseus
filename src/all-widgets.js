var Widgets = require("./widgets.js");

_.each([
    require("./widgets/categorizer.jsx"),
    require("./widgets/dropdown.jsx"),
    require("./widgets/example-graphie-widget.jsx"),
    [
        require("./widgets/explanation.jsx"),
        require("./widgets/explanation-editor.jsx")
    ],
    require("./widgets/expression.jsx"),
    require("./widgets/iframe.jsx"),
    require("./widgets/image.jsx"),
    require("./widgets/input-number.jsx"),
    require("./widgets/interactive-graph.jsx"),
    require("./widgets/interactive-number-line.jsx"),
    require("./widgets/lights-puzzle.jsx"),
    require("./widgets/matcher.jsx"),
    require("./widgets/matrix.jsx"),
    require("./widgets/measurer.jsx"),
    [
        require("./widgets/molecule.jsx"),
        require("./widgets/molecule-editor.jsx")
    ],
    require("./widgets/number-line.jsx"),
    require("./widgets/numeric-input.jsx"),
    require("./widgets/orderer.jsx"),
    require("./widgets/plotter.jsx"),
    require("./widgets/radio.jsx"),
    [
        require("./widgets/reaction-diagram.jsx"),
        require("./widgets/reaction-diagram-editor.jsx")
    ],
    require("./widgets/sorter.jsx"),
    require("./widgets/table.jsx"),
    require("./widgets/transformer.jsx"),
    require("./widgets/speaking-text-input.jsx"),
    require("./widgets/speaking-voice.jsx")
], function(_widget) {
    if (Array.isArray(_widget)) {
        var [{name, ...widget}, editor] = _widget;
    } else {
        var {name, editor, ...widget} = _widget;
    }
    Widgets.register(name, widget, editor);
});
