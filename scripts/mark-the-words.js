/*global H5P*/

/**
 * Mark The Words module
 * @external {jQuery} $ H5P.jQuery
 */
H5P.MarkTheWords = (function ($, Question, Word, KeyboardNav) {
  // CSS Main Containers:
  var MAIN_CONTAINER = "h5p-word";
  var INNER_CONTAINER = "h5p-word-inner";
  var WORDS_CONTAINER = "h5p-word-selectable-words";
  var BUTTON_CONTAINER = "h5p-button-bar";

  /**
   * Initialize module.
   *
   * @class H5P.MarkTheWords
   * @extends H5P.Question
   * @param {Object} params Behavior settings
   * @param {Number} contentId Content identification
   * @param {Object} contentData Object containing task specific content data
   *
   * @returns {Object} MarkTheWords Mark the words instance
   */
  function MarkTheWords(params, contentId, contentData) {
    var self = this;
    this.contentId = contentId;

    Question.call(this, 'mark-the-words');

    // Set default behavior.
    this.params = $.extend({}, {
      taskDescription: "",
      textField: "This is a *nice*, *flexible* content type.",
      behaviour: {
        enableRetry: true,
        enableSolutionsButton: true
      },
      checkAnswerButton: "Check",
      tryAgainButton: "Retry",
      showSolutionButton: "Show solution",
      score: "You got @score of @total points"
    }, params);

    this.contentData = contentData;
    if (this.contentData !== undefined && this.contentData.previousState !== undefined) {
      this.previousState = this.contentData.previousState;
    }

    // Add keyboard navigation helper
    this.keyboardNav = new KeyboardNav();
    // on word clicked
    this.keyboardNav.on('selected', function(event){
      self.isAnswered = true;
      self.triggerXAPI('interacted');
    });

    this.initMarkTheWords();
    this.XapiGenerator = new H5P.MarkTheWords.XapiGenerator(this);
  }

  MarkTheWords.prototype = Object.create(H5P.EventDispatcher.prototype);
  MarkTheWords.prototype.constructor = MarkTheWords;

  /**
   * Initialize Mark The Words task
   */
  MarkTheWords.prototype.initMarkTheWords = function () {
    this.$inner = $('<div class=' + INNER_CONTAINER + '></div>');

    this.addTaskTo(this.$inner);

    // Set user state
    this.setH5PUserState();
  };

  /**
   * Recursive function that creates html for the words
   * @method createHtmlForWords
   * @param  {Array}           nodes Array of dom nodes
   * @return {string}
   */
  MarkTheWords.prototype.createHtmlForWords = function (nodes) {
    var self = this;
    var html = '';
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];

      if (node instanceof Text) {
        var text = $(node).text();
        var selectableStrings = text.replace(/(&nbsp;|\r\n|\n|\r)/g, ' ')
          .match(/ \*[^\*]+\* |[^\s]+/g);

        if (selectableStrings) {
          selectableStrings.forEach(function (entry) {
            entry = entry.trim();

            // Words
            if (html) {
              // Add space before
              html += ' ';
            }

            // Remove prefix punctuations from word
            var prefix = entry.match(/^[\[\({⟨¿¡“"«„]+/);
            var start = 0;
            if (prefix !== null) {
              start = prefix[0].length;
              html += prefix;
            }

            // Remove suffix punctuations from word
            var suffix = entry.match(/[",….:;?!\]\)}⟩»”]+$/);
            var end = entry.length - start;
            if (suffix !== null) {
              end -= suffix[0].length;
            }

            // Word
            entry = entry.substr(start, end);
            if (entry.length) {
              html += '<span role="option">' + entry + '</span>';
            }

            if (suffix !== null) {
              html += suffix;
            }
          });
        }
        else if ((selectableStrings !== null) && text.length) {
          html += '<span role="option">' + text + '</span>';
        }
      }
      else {
        if (node.nodeName === 'BR') {
          html += '<br/>';
        }
        else {
          var attributes = ' ';
          for (var j = 0; j < node.attributes.length; j++) {
            attributes +=node.attributes[j].name + '="' + node.attributes[j].nodeValue + '" ';
          }
          html += '<' + node.nodeName +  attributes + '>';
          html += self.createHtmlForWords(node.childNodes);
          html += '</' + node.nodeName + '>';
        }
      }
    }

    return html;
  };

  /**
   * Search for the last children in every paragraph and 
   * return their indexes in an array 
   *
   * @returns {Array}
   */
  MarkTheWords.prototype.getIndexesOfLineBreaks = function () {

    var indexes = [];
    var selectables = this.$wordContainer.find('span.h5p-word-selectable');  

    selectables.each(function(index, selectable) {
      if ($(selectable).next().is('br')){
        indexes.push(index);
      }

      if ($(selectable).parent('p') && !$(selectable).parent().is(':last-child') && $(selectable).is(':last-child')){
        indexes.push(index);
      }
    });

    return indexes;
  }

  /**
   * Handle task and add it to container.
   * @param {jQuery} $container The object which our task will attach to.
   */
  MarkTheWords.prototype.addTaskTo = function ($container) {
    var self = this;
    self.selectableWords = [];
    self.answers = 0;

    // Wrapper
    var $wordContainer = $('<div/>', {
      'class': WORDS_CONTAINER,
      'aria-multiselect': true,
      'role': 'listbox',
      'tabindex': 0,
      html: self.createHtmlForWords($.parseHTML(self.params.textField))
    });

    $wordContainer.find('[role="option"]').each(function () {
      // Add keyboard navigation to this element
      self.keyboardNav.addElement(this);

      var selectableWord = new Word($(this));
      if (selectableWord.isAnswer()) {
        self.answers += 1;
      }
      self.selectableWords.push(selectableWord);
    });

    self.blankIsCorrect = (self.answers === 0);
    if (self.blankIsCorrect) {
      self.answers = 1;
    }

    $wordContainer.appendTo($container);
    self.$wordContainer = $wordContainer;
  };

  /**
   * Add check solution and retry buttons.
   */
  MarkTheWords.prototype.addButtons = function () {
    var self = this;
    self.$buttonContainer = $('<div/>', {'class': BUTTON_CONTAINER});

    this.addButton('check-answer', this.params.checkAnswerButton, function () {
      self.isAnswered = true;
      self.keyboardNav.removeAllTabbable();
      self.feedbackSelectedWords();
      self.hideButton('check-answer');
      if (!self.showEvaluation()) {
        // Only show if a correct answer was not found.
        if (self.params.behaviour.enableSolutionsButton && (self.correctAnswers < self.answers)) {
          self.showButton('show-solution');
        }
        if (self.params.behaviour.enableRetry) {
          self.showButton('try-again');
        }
      }
      self.triggerXAPIScored(self.getScore(), self.getMaxScore(), 'answered');
    });

    this.addButton('try-again', this.params.tryAgainButton, function () {
      self.clearAllMarks();
      self.hideEvaluation();
      self.keyboardNav.setTabbableAt(0);
      self.hideButton('try-again');
      self.hideButton('show-solution');
      self.showButton('check-answer');
      self.isAnswered = false;
    }, false);

    this.addButton('show-solution', this.params.showSolutionButton, function () {
      self.keyboardNav.removeAllTabbable();
      self.setAllMarks();
      self.hideButton('check-answer');
      self.hideButton('show-solution');
      if (self.params.behaviour.enableRetry) {
        self.showButton('try-again');
      }
    }, false);
  };

  /**
   * Get Xapi Data.
   *
   * @see used in contracts {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
   * @return {Object}
   */
  MarkTheWords.prototype.getXAPIData = function () {
    return {
      statement: this.XapiGenerator.generateAnsweredEvent().data.statement
    };
  };

  /**
   * Set whether all the words should be selectable.
   * @public
   * @param {Boolean} selectable Set to true to make the words selectable.
   */
  MarkTheWords.prototype.setAllSelectable = function (selectable) {
    this.selectableWords.forEach(function (entry) {
      entry.setSelectable(selectable);
    });
  };

  /**
   * Mark the words as correct, wrong or missed.
   */
  MarkTheWords.prototype.setAllMarks = function () {
    this.selectableWords.forEach(function (entry) {
      entry.markCheck();
    });
    this.trigger('resize');
  };

  /**
   * Mark the selected words as correct or wrong.
   */
  MarkTheWords.prototype.feedbackSelectedWords = function () {
    this.selectableWords.forEach(function (entry) {
      if (entry.isSelected()) {
        entry.markCheck();
      }
    });
    this.trigger('resize');
  };

  /**
   * Evaluate task and display score text for word markings.
   *
   * @return {Boolean} Returns true if maxScore was achieved.
   */
  MarkTheWords.prototype.showEvaluation = function () {
    this.hideEvaluation();
    this.calculateScore();

    var score = ((this.correctAnswers - this.wrongAnswers) <= 0) ? 0 : (this.correctAnswers - this.wrongAnswers);
    //replace editor variables with values, uses regexp to replace all instances.
    var scoreText = this.params.score.replace(/@score/g, score.toString())
      .replace(/@total/g, this.answers.toString())
      .replace(/@correct/g, this.correctAnswers.toString())
      .replace(/@wrong/g, this.wrongAnswers.toString())
      .replace(/@missed/g, this.missedAnswers.toString());

    this.setFeedback(scoreText, score, this.answers);

    this.trigger('resize');
    return score === this.answers;
  };

  /**
   * Clear the evaluation text.
   */
  MarkTheWords.prototype.hideEvaluation = function () {
    this.setFeedback();
    this.trigger('resize');
  };

  /**
   * Calculate score and store them in class variables.
   */
  MarkTheWords.prototype.calculateScore = function () {
    var self = this;
    self.correctAnswers = 0;
    self.wrongAnswers = 0;
    self.missedAnswers = 0;
    self.selectableWords.forEach(function (entry) {
      if (entry.isCorrect()) {
        self.correctAnswers += 1;
      } else if (entry.isWrong()) {
        self.wrongAnswers += 1;
      } else if (entry.isMissed()) {
        self.missedAnswers += 1;
      }
    });

    if (self.blankIsCorrect && self.wrongAnswers === 0) {
      self.correctAnswers += 1;
    }
  };

  /**
   * Clear styling on marked words.
   */
  MarkTheWords.prototype.clearAllMarks = function () {
    this.selectableWords.forEach(function (entry) {
      entry.markClear();
    });
    this.trigger('resize');
  };

  /**
   * Needed for contracts.
   * Returns true if task is checked or a word has been clicked
   *
   * @returns {Boolean} Always returns true.
   */
  MarkTheWords.prototype.getAnswerGiven = function () {
    return this.blankIsCorrect ? true : this.isAnswered;
  };

  /**
   * Needed for contracts.
   * Counts the score, which is correct answers subtracted by wrong answers.
   *
   * @returns {Number} score The amount of points achieved.
   */
  MarkTheWords.prototype.getScore = function () {
    this.calculateScore();
    return ((this.correctAnswers - this.wrongAnswers) <= 0) ? 0 : (this.correctAnswers - this.wrongAnswers);
  };

  /**
   * Needed for contracts.
   * Gets max score for this task.
   *
   * @returns {Number} maxScore The maximum amount of points achievable.
   */
  MarkTheWords.prototype.getMaxScore = function () {
    return this.answers;
  };

  /**
   * Get title
   * @returns {string}
   */
  MarkTheWords.prototype.getTitle = function () {
    return H5P.createTitle(this.params.taskDescription);
  };

  /**
   * Needed for contracts.
   * Display the evaluation of the task, with proper markings.
   */
  MarkTheWords.prototype.showSolutions = function () {
    this.showEvaluation();
    this.setAllMarks();
    this.hideAllButtons();
    this.keyboardNav.removeAllTabbable();
  };

  /**
   * Needed for contracts.
   * Resets the task back to its' initial state.
   */
  MarkTheWords.prototype.resetTask = function () {
    this.isAnswered = false;
    this.clearAllMarks();
    this.hideEvaluation();
    this.keyboardNav.setTabbableAt(0);
    this.hideButton('try-again');
    this.hideButton('show-solution');
    this.showButton('check-answer');
  };

  /**
   * Hide all buttons. Used to disable further input for user.
   */
  MarkTheWords.prototype.hideAllButtons = function () {
    this.hideButton('try-again');
    this.hideButton('show-solution');
    this.hideButton('check-answer');
    this.trigger('resize');
  };

  /**
   * Returns an object containing the selected words
   *
   * @returns {object} containing indexes of selected words
   */
  MarkTheWords.prototype.getCurrentState = function () {
    var selectedWordsIndexes = [];
    if (this.selectableWords === undefined) {
      return undefined;
    }

    this.selectableWords.forEach(function (selectableWord, swIndex) {
      if (selectableWord.isSelected()) {
        selectedWordsIndexes.push(swIndex);
      }
    });
    return selectedWordsIndexes;
  };

  /**
   * Sets answers to current user state
   */
  MarkTheWords.prototype.setH5PUserState = function () {
    var self = this;

    // Do nothing if user state is undefined
    if (this.previousState === undefined || this.previousState.length === undefined) {
      return;
    }

    // Select words from user state
    this.previousState.forEach(function (answeredWordIndex) {
      if (isNaN(answeredWordIndex) || answeredWordIndex >= self.selectableWords.length || answeredWordIndex < 0) {
        throw new Error('Stored user state is invalid');
      }
      self.selectableWords[answeredWordIndex].setSelected();
    });
  };

  MarkTheWords.prototype.registerDomElements = function () {

    // Register description
    this.setIntroduction(this.params.taskDescription);

    // Register content
    this.setContent(this.$inner, {
      'class': MAIN_CONTAINER
    });

    // Register buttons
    this.addButtons();
  };

  return MarkTheWords;
}(H5P.jQuery, H5P.Question, H5P.MarkTheWords.Word, H5P.KeyboardNav));
