var React = require('react');
var ReactDOM = require('react-dom');
var classNames = require("classnames");

var Changeable = require("../mixins/changeable.jsx");
var ApiClassNames = require("../perseus-api.jsx").ClassNames;
var BlurInput    = require("react-components/js/blur-input.jsx");
var ButtonGroup = require("react-components/js/button-group.jsx");
var Editor = require("../editor.jsx");
var PropCheckBox = require("../components/prop-check-box.jsx");
var Renderer = require("../renderer.jsx");

var InfoTip = require("react-components/js/info-tip.jsx");

var shuffle = require("../util.js").shuffle;
var seededRNG = require("../util.js").seededRNG;
var captureScratchpadTouchStart =
        require("../util.js").captureScratchpadTouchStart;

var BaseRadio = React.createClass({
    propTypes: {
        labelWrap: React.PropTypes.bool,
        multipleSelect: React.PropTypes.bool,
        onCheckedChange: React.PropTypes.func,
        showClues: React.PropTypes.bool,
        onePerLine: React.PropTypes.bool
    },

    getDefaultProps: function() {
        return {
            onePerLine: true
        };
    },

    render: function() {
        var radioGroupName = _.uniqueId("perseus_radio_");
        var inputType = this.props.multipleSelect ? "checkbox" : "radio";

        return <ul className={"perseus-widget-radio " +
                "above-scratchpad"}>
            {this.props.choices.map(function(choice, i) {

                var content = <div>
                        {choice.content}
                    </div>;

                var classSet = {
                    "inline": !this.props.onePerLine
                };
                classSet[ApiClassNames.RADIO.OPTION] = true;
                classSet[ApiClassNames.RADIO.SELECTED] = choice.checked;
                var className = classNames(classSet);

                return <li className={className} key={i}><div>
                    <span className="checkbox">
                        <input
                            ref={"radio" + i}
                            type={inputType}
                            name={radioGroupName}
                            checked={choice.checked}
                            onChange={(e) => {
                                this.checkOption(i, e.target.checked);
                            }} />
                    </span>
                    {/* A pseudo-label. <label> is slightly broken on iOS,
                        so this works around that. Unfortunately, it is
                        simplest to just work around that everywhere. */}
                    <span
                            className={
                                "interactive-component " +
                                ApiClassNames.RADIO.OPTION_CONTENT
                            }
                            style={{
                                cursor: "default",
                            }}
                            onTouchStart={!this.props.labelWrap ?
                                null : captureScratchpadTouchStart
                            }
                            onClick={!this.props.labelWrap ? null : (e) => {
                                // Don't send this to the scratchpad
                                e.preventDefault();
                                this.checkOption(i,
                                    (this.props.multipleSelect ?
                                        !choice.checked :
                                        true
                                    )
                                );
                            }}>
                        {content}
                    </span>
                    {Exercises.cluesEnabled === "cluesEnabled" &&
                        this.props.showClues && choice.checked &&
                        <div className="perseus-radio-clue">
                            {choice.clue}
                        </div>}
                </div></li>;

            }, this)}
        </ul>;
    },

    checkOption: function(radioIndex, shouldBeChecked) {
        var newChecked;
        if (this.props.multipleSelect) {
            // When multipleSelect is on, clicking an index toggles the
            // selection of just that index.
            newChecked = _.map(this.props.choices, (choice, i) => {
                return (i === radioIndex) ? shouldBeChecked : choice.checked;
            });
        } else {
            // When multipleSelect is turned off, we always select the
            // clicked index, and unselect everything else.
            newChecked = _.map(this.props.choices, (choice, i) => {
                return i === radioIndex;
            });
        }

        // We send just the array of [true/false] checked values here;
        // onCheckedChange reconstructs the new choices to send to
        // this.props.onChange
        this.props.onCheckedChange(newChecked);
    },

    focus: function(i) {
        ReactDOM.findDOMNode(this.refs["radio" + (i || 0)]).focus();
        return true;
    }
});

var Radio = React.createClass({
    getDefaultProps: function() {
        return {
            choices: 
            [{}],
            displayCount: null,
            multipleSelect: false,
        };
    },

    getInitialState: function() {
        return {
            showClues: false
        };
    },

    render: function() {
        var choices = this.props.choices;
        var values = this.props.values || _.map(choices, () => false);
        var revealNoneOfTheAbove = this._shouldRevealNoneOfTheAbove(choices,
                                                                    values);
        choices = _.map(choices, (choice, i) => {
            var content;
            if (choice.isNoneOfTheAbove && !revealNoneOfTheAbove) {
                content = { content: "None of the above" };
            } else {
                content = _.pick(choice, "content");
            }
            return {
                // We need to make a copy, which _.pick does
                content: <Renderer {...content} />,
                checked: values[i],
                clue: <Renderer content={choice.clue} />,
            };
        });
        choices = this.enforceOrdering(choices);

        return <BaseRadio
            ref="baseRadio"
            labelWrap={true}
            onePerLine={this.props.onePerLine}
            multipleSelect={this.props.multipleSelect}
            showClues={this.state.showClues}
            choices={choices.map(function(choice) {
                return _.pick(choice, "content", "checked", "clue");
            })}
            onCheckedChange={this.onCheckedChange} />;
    },

    _shouldRevealNoneOfTheAbove: function(choices, values) {
        // We reveal when 'None of the above' is the correct choice
        // and the entire question is completed. If 'None of the above' isn't
        // selected and the question is completed, then it's the wrong choice
        // and not worth revealing.
        var noneOfTheAboveSelected = _.any(choices, (choice, i) => {
            return choice.isNoneOfTheAbove && values[i];
        });
        return this.props.questionCompleted && this.props.noneOfTheAbove &&
                    noneOfTheAboveSelected;
    },

    focus: function(i) {
        return this.refs.baseRadio.focus(i);
    },

    onCheckedChange: function(checked) {
        this.setState({showClues: false});
        this.props.onChange({
            values: checked
        });
    },

    setAnswerFromJSON: function(answerData) {
        if (answerData === undefined) {
            var renderedAnswerData = {values: undefined};
        } else {
            var renderedAnswerData = {'values': []};
            for (var i = 0; i < this.props.choices.length; i++) {
                renderedAnswerData['values'].push(answerData['values'][this.props.choices[i].originalIndex]);
            }
        }
        this.props.onChange(renderedAnswerData);
    },

    toJSON: function(skipValidation) {
        // Return checked inputs in the form {values: [bool]}. (Dear future
        // timeline implementers: this used to be {value: i} before multiple
        // select was added)
        if (this.props.values) {
            var noneOfTheAboveIndex = null;
            var noneOfTheAboveSelected = false;

            var values = this.props.values.slice();

            for (var i = 0; i < this.props.values.length; i++) {
                var index = this.props.choices[i].originalIndex;
                values[index] = this.props.values[i];

                if (this.props.choices[i].isNoneOfTheAbove) {
                    noneOfTheAboveIndex = index;

                    if (values[i]) {
                        noneOfTheAboveSelected = true;
                    }
                }
            }

            return {
                values: values,
            };
        } else {
            // Nothing checked
            return {
                values: _.map(this.props.choices, () => false)
            };
        }
    },

    simpleValidate: function(rubric) {
        this.setState({showClues: true});
        return Radio.validate(this.toJSON(), rubric);
    },

    enforceOrdering: function(choices) {
        var content = _.pluck(choices, "content");
        if (_.isEqual(content, [$._("False"), $._("True")]) ||
            _.isEqual(content, [$._("No"), $._("Yes")])) {
            return ([choices[1]]).concat([choices[0]]);
        }
        return choices;
    },

    statics: {
        displayMode: "inline-block"
    }
});

_.extend(Radio, {
    validate: function(state, rubric) {
        var numSelected = _.reduce(state.values, function(sum, selected) {
            return sum + ((selected) ? 1 : 0); }
        , 0);

        if (numSelected === 0) {
            return {
                type: "invalid",
                message: null
            };
        // If NOTA and some other answer are checked, ...
        } else if (state.noneOfTheAboveSelected && numSelected > 1) {
            return {
                type: "invalid",
                message: $._("'None of the above' may not be selected " +
                                    "when other answers are selected.")
             };
        } else {
            /* jshint -W018 */
            var correct = _.all(state.values, function(selected, i) {
                var isCorrect;
                if (state.noneOfTheAboveIndex === i) {
                    isCorrect = _.all(rubric.choices, function(choice, j) {
                        return i === j || !choice.correct;
                    });
                } else {
                    isCorrect = !!rubric.choices[i].correct;
                }
                return isCorrect === selected;
            });
            /* jshint +W018 */

            return {
                type: "points",
                earned: correct ? 1 : 0,
                total: 1,
                message: rubric.choices[_.indexOf(state.values, true)].clue
            };
        }
    }
});

var RadioEditor = React.createClass({
    mixins: [Changeable],

    propTypes: {
        choices: React.PropTypes.arrayOf(React.PropTypes.shape({
            content: React.PropTypes.string,
            clue: React.PropTypes.string,
            correct: React.PropTypes.bool
        })),
        displayCount: React.PropTypes.number,
        randomize: React.PropTypes.bool,
        noneOfTheAbove: React.PropTypes.bool,
        multipleSelect: React.PropTypes.bool,
        onePerLine: React.PropTypes.bool
    },

    getDefaultProps: function() {
        return {
            choices: 
            [{},{}],
            displayCount: null,
            randomize: false,
            noneOfTheAbove: false,
            multipleSelect: false,
            onePerLine: true
        };
    },

    render: function() {
        return <div>
            <div className="perseus-widget-row">

                <div className="perseus-widget-left-col">
                    <PropCheckBox label="多選題"
                                  labelAlignment="right"
                                  multipleSelect={this.props.multipleSelect}
                                  onChange={this.onMultipleSelectChange} />
                </div>

            </div>

            <BaseRadio
                ref="baseRadio"
                multipleSelect={this.props.multipleSelect}
                onePerLine={true}
                labelWrap={false}
                choices={this.props.choices.map(function(choice, i) {
                    var checkedClass = choice.correct ?
                        "correct" :
                        "incorrect";

                    var editor = <Editor
                        className="content-editor"
                        ref={"editor" + i}
                        content={choice.content || ""}
                        widgetEnabled={false}
                        placeholder={"請輸入選項內容"}
                        onChange={newProps => {
                            if ("content" in newProps) {
                                this.onContentChange(i, newProps.content);
                            }}
                        }
                    />;
                    var clueEditor = <Editor
                        ref={"clue-editor-" + i}
                        content={choice.clue || ""}
                        widgetEnabled={false}
                        placeholder={$._("為什麼這個選項 " +
                            checkedClass + "?")}
                        onChange={newProps => {
                            if ("content" in newProps) {
                                this.onClueChange(i, newProps.content);
                            }}
                        }
                        disableImageLoader={true}
                    />;
                    var deleteLink = <a href="#"
                            className="simple-button orange delete-choice"
                            title="Remove this choice"
                            onClick={this.onDelete.bind(this, i)}>
                        <span className="icon-trash" />
                    </a>;
                    return {
                        content: <div className="choice-clue-editors">
                            <div className={"choice-editor " + checkedClass}>
                                {editor}
                            </div>
                            {/* TODO(eater): Remove this condition after clues
                                            are fully launched. */}
                            {(!window.KA || window.KA.allowEditingClues) &&
                                <div className="clue-editor">
                                    {clueEditor}
                                </div>
                            }
                            {this.props.choices.length >= 2 && deleteLink}
                        </div>,
                        checked: choice.correct
                    };
                }, this)}
                onCheckedChange={this.onCheckedChange} />

            <div className="add-choice-container">
                <a href="#" className="simple-button orange"
                        onClick={this.addChoice}>
                    <span className="icon-plus" />
                    {' '}增加選項{' '}
                </a>
            </div>

        </div>;
    },

    onMultipleSelectChange: function(allowMultiple) {
        allowMultiple = allowMultiple.multipleSelect;

        var numSelected = _.reduce(this.props.choices,
                function(memo, choice) {
            return choice.correct ? memo + 1 : memo;
        }, 0);

        if (!allowMultiple && numSelected > 1) {
            var choices = _.map(this.props.choices, function(choice) {
                return _.defaults({
                    correct: false
                }, choice);
            });
            this.props.onChange({
                multipleSelect: allowMultiple,
                choices: choices
            });

        } else {
            this.props.onChange({
                multipleSelect: allowMultiple
            });
        }
    },

    onFileInputChange: function(choiceIndex, newImage) {
        var file    = newImage.target.files[0]; 
        var reader  = new FileReader();
        var choices = this.props.choices.slice();
        var i = new Image(); 
        var that = this;
        reader.onloadend = function() {
            i.src = reader.result;
            i.onload = function(){
                that.props.onChange({choices: choices});
            };
            choices[choiceIndex] = _.extend({}, choices[choiceIndex], {
                content: "![](" + reader.result + ")",
            });
        }
        reader.readAsDataURL(file);
    },

    onCheckedChange: function(checked) {
        var choices = _.map(this.props.choices, function(choice, i) {
            return _.extend({}, choice, {correct: checked[i]});
        });
        this.props.onChange({choices: choices});
    },

    onContentChange: function(choiceIndex, newContent) {
        var choices = this.props.choices.slice();
        choices[choiceIndex] = _.extend({}, choices[choiceIndex], {
            content: newContent
        });
        this.props.onChange({choices: choices});
    },

    onClueChange: function(choiceIndex, newClue) {
        var choices = this.props.choices.slice();
        choices[choiceIndex] = _.extend({}, choices[choiceIndex], {
            clue: newClue
        });
        if (newClue === "") {
            delete choices[choiceIndex].clue;
        }
        this.props.onChange({choices: choices});
    },

    onDelete: function(choiceIndex, e) {
        e.preventDefault();
        var choices = this.props.choices.slice();
        choices.splice(choiceIndex, 1);
        this.props.onChange({choices: choices});
    },

    addChoice: function(e) {
        e.preventDefault();

        var choices = this.props.choices;
        this.props.onChange({choices: choices.concat([{}])}, () => {
            this.refs["editor" + choices.length].focus();
        });
    },

    setDisplayCount: function(num){
        this.props.onChange({displayCount: num});
    },

    focus: function() {
        this.refs.editor0.focus();
        return true;
    },

    toJSON: function(skipValidation) {
        if (!skipValidation &&
                !_.some(_.pluck(this.props.choices, "correct"))) {
            alert("Warning: No choice is marked as correct.");
        }

        return _.pick(this.props, "choices", "randomize",
            "multipleSelect", "displayCount", "noneOfTheAbove", "onePerLine");
    }
});

var choiceTransform = (editorProps) => {

    var randomize = function(array) {
        if (editorProps.randomize) {
            return shuffle(array, editorProps.problemNum);
        } else {
            return array;
        }
    };

    var addNoneOfAbove = function(array) {
        // Pick a random choice to replace with 'None of the above'
        if (!editorProps.randomize && editorProps.noneOfTheAbove) {
            // Seed RNG with problemNum
            var rand = seededRNG(editorProps.problemNum)();
            var randomIndex = Math.floor(rand * array.length);
            var itemToBeReplaced = array[randomIndex];

            // Shift array left so that 'None of the above' is last
            array.splice(randomIndex, 1);
            array.push(itemToBeReplaced);
        }

        array[array.length - 1].isNoneOfTheAbove = editorProps.noneOfTheAbove;
        return array;
    };

    // Add meta-information to choices
    var choices = editorProps.choices.slice();
    choices = _.map(choices, function(choice, i) {
        return _.extend({}, _.omit(choice, "correct"),
            { originalIndex: i, isNoneOfTheAbove: false }
        );
    });

    // Randomize and add 'None of the above'
    choices = addNoneOfAbove(randomize(choices));

    editorProps = _.extend({}, editorProps, { choices: choices });
    return _.pick(editorProps, "choices", "noneOfTheAbove", "onePerLine",
        "multipleSelect", "correctAnswer");
};

module.exports = {
    name: "radio",
    type: "A.基本題型",
    displayName: "Radio/選擇題",
    widget: Radio,
    editor: RadioEditor,
    transform: choiceTransform
};
