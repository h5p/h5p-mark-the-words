var H5P = H5P || {};

/**
 * Mark The Words module
 * @external {jQuery} $ H5P.jQuery
 */
H5P.MarkTheWords = (function ($) {
  //CSS Main Containers:
  var MAIN_CONTAINER = "h5p-word";
  var INNER_CONTAINER = "h5p-word-inner";
  var TITLE_CONTAINER = "h5p-word-title";
  var WORDS_CONTAINER = "h5p-word-selectable-words";
  var FOOTER_CONTAINER = "h5p-word-footer";
  var EVALUATION_CONTAINER = "h5p-word-evaluation-container";
  var BUTTON_CONTAINER = "h5p-button-bar";

  //Special Sub-containers:
  var EVALUATION_SCORE = "h5p-word-evaluation-score";
  var EVALUATION_EMOTICON = "h5p-word-evaluation-score-emoticon";
  var EVALUATION_EMOTICON_MAX_SCORE = "max-score";

  //CSS Buttons:
  var BUTTONS = "h5p-button";
  var CHECK_BUTTON = "h5p-check-button";
  var RETRY_BUTTON = "h5p-retry-button";
  var SHOW_SOLUTION_BUTTON = "h5p-show-solution-button";

  //CSS Classes for marking words:
  var MISSED_MARK = 'h5p-word-missed';
  var CORRECT_MARK = 'h5p-word-correct';
  var WRONG_MARK = 'h5p-word-wrong';
  var SELECTED_MARK = 'h5p-word-selected';
  var SELECTABLE_MARK = 'h5p-word-selectable';

  /**
   * Initialize module.
   * @param {Object} params Behavior settings
   * @param {Number} id Content identification
   *
   * @returns {Object} C Mark the words instance
   */
  function C(params, id) {
    this.$ = $(this);
    this.id = id;

    // Set default behavior.
    this.params = $.extend({}, {
      taskDescription: "Highlight the adjectives in the following sentence",
      textField: "This is a *nice*, *flexible* content type.",
      enableRetry: true,
      enableShowSolution: true,
      checkAnswerButton: "Check",
      tryAgainButton: "Retry",
      showSolutionButton: "Show solution",
      score: "You got @score of @total points."
    }, params);
  }

  /**
   * Append field to wrapper.
   * @param {jQuery} $container the jQuery object which this module will attach itself to.
   */
  C.prototype.attach = function ($container) {
    this.$inner = $container.addClass(MAIN_CONTAINER)
        .html('<div class=' + INNER_CONTAINER + '><div class=' + TITLE_CONTAINER + '>' + this.params.taskDescription + '</div></div>')
        .children();
    this.addTaskTo(this.$inner);

    // Add score and button containers.
    this.addFooter();
  };
  
  /**
   * Handle task and add it to container.
   * @param {jQuery} $container The object which our task will attach to.
   */
  C.prototype.addTaskTo = function ($container) {
    var self = this;
    var textField = self.params.textField;
    self.selectableWords = [];
    self.answers = 0;

    //Regexp for splitting string on whitespace(s).
    var selectableStrings = textField.replace(/(\r\n|\n|\r)/gm," <br> ").split(/[\s]+/);

    var $wordContainer = $('<div/>', {'class': WORDS_CONTAINER});
    //Make each word selectable
    selectableStrings.forEach(function (entry) {
      var selectableWord = new Word(entry, $wordContainer);
      if (selectableWord.isAnswer()) {
        self.answers += 1;
      }
      self.selectableWords.push(selectableWord);
    });
    $wordContainer.appendTo($container);
  };

  /**
   * Append footer to inner block.
   */
  C.prototype.addFooter = function () {
    this.$footer = $('<div/>', {
      'class': FOOTER_CONTAINER
    }).appendTo(this.$inner);
    this.$evaluation = $('<div/>', {
      'class': EVALUATION_CONTAINER
    }).appendTo(this.$footer);
    this.addButtons();
  };

  /**
   * Add check solution and retry buttons.
   */
  C.prototype.addButtons = function () {
    var self = this;
    self.$buttonContainer = $('<div/>', {'class': BUTTON_CONTAINER});

    var $checkAnswerButton = $('<button/>', {
      'class': BUTTONS + ' ' + CHECK_BUTTON,
      type: 'button',
      text: this.params.checkAnswerButton
    }).appendTo(self.$buttonContainer).click(function () {
      self.setAllSelectable(false);
      self.feedbackSelectedWords();
      $checkAnswerButton.hide();
      if (!self.showEvaluation()) {
        if (self.params.enableShowSolution) {
          $showSolutionButton.show();
        }
        if (self.params.enableRetry) {
          $retryButton.show();
        }
      }
    });

    var $retryButton =  $('<button/>', {
      'class': BUTTONS + ' ' + RETRY_BUTTON,
      type: 'button',
      text: this.params.tryAgainButton
    }).appendTo(self.$buttonContainer).click(function () {
      self.clearAllMarks();
      self.hideEvaluation();
      self.setAllSelectable(true);
      $retryButton.hide();
      $showSolutionButton.hide();
      $checkAnswerButton.show();
    });
    self.$buttonContainer.appendTo(this.$footer);

    var $showSolutionButton = $('<button/>', {
      'class': BUTTONS+' '+ SHOW_SOLUTION_BUTTON,
      type: 'button',
      text: this.params.showSolutionButton
    }).appendTo(self.$buttonContainer).click(function () {
      self.setAllSelectable(false);
      self.setAllMarks();
      $checkAnswerButton.hide();
      $showSolutionButton.hide();
      if (self.params.enableRetry) {
        $retryButton.show();
      }
    });

  };

  /**
   * Set whether all the words should be selectable.
   * @public
   * @param {Boolean} selectable Set to true to make the words selectable.
   */
  C.prototype.setAllSelectable = function (selectable) {
    this.selectableWords.forEach(function (entry) {
      entry.setSelectable(selectable);
    });
  };

  /**
   * Mark the words as correct, wrong or missed.
   */
  C.prototype.setAllMarks = function () {
    this.selectableWords.forEach(function (entry) {
      entry.markCheck();
    });
  };

  /**
   * Mark the selected words as correct or wrong.
   */
  C.prototype.feedbackSelectedWords = function () {
    this.selectableWords.forEach(function (entry) {
      if (entry.isSelected()) {
        entry.markCheck();
      }
    });
  };

  /**
   * Evaluate task and display score text for word markings.
   *
   * @return {Boolean} Returns true if maxScore was achieved.
   */
  C.prototype.showEvaluation = function () {
    this.hideEvaluation();
    this.calculateScore();

    var score = ((this.correctAnswers - this.wrongAnswers) <= 0) ? 0 : (this.correctAnswers - this.wrongAnswers);
    //replace editor variables with values, uses regexp to replace all instances.
    var scoreText = this.params.score.replace(/@score/g, score.toString())
      .replace(/@total/g, this.answers.toString())
      .replace(/@correct/g, this.correctAnswers.toString())
      .replace(/@wrong/g, this.wrongAnswers.toString())
      .replace(/@missed/g, this.missedAnswers.toString());

    //Append evaluation emoticon and score to evaluation container.
    $('<div class=' + EVALUATION_EMOTICON + '></div>').appendTo(this.$evaluation);
    $('<div class=' + EVALUATION_SCORE + '>' + scoreText + '</div>').appendTo(this.$evaluation);
    if (score === this.answers) {
      this.$evaluation.addClass(EVALUATION_EMOTICON_MAX_SCORE);
    }
    else {
      this.$evaluation.removeClass(EVALUATION_EMOTICON_MAX_SCORE);
    }
    return score === this.answers;
  };

  /**
   * Clear the evaluation text.
   */
  C.prototype.hideEvaluation = function () {
    this.$evaluation.html('');
  };

  /**
   * Calculate score and store them in class variables.
   */
  C.prototype.calculateScore = function () {
    var self = this;
    self.correctAnswers = 0;
    self.wrongAnswers = 0;
    self.missedAnswers = 0;
    self.selectableWords.forEach(function (entry) {
      if(entry.isCorrect()) {
        self.correctAnswers += 1;
      }
      else if(entry.isWrong()) {
        self.wrongAnswers += 1;
      }
      else if(entry.isMissed()) {
        self.missedAnswers += 1;
      }
    });
  };

  /**
   * Clear styling on marked words.
   */
  C.prototype.clearAllMarks = function () {
    this.selectableWords.forEach( function (entry) {
      entry.markClear();
    });
  };

  /**
   * Needed for contracts.
   * Always returns true, since MTW has no required actions to give an answer. Also calculates score.
   *
   * @returns {Boolean} Always returns true.
   */
  C.prototype.getAnswerGiven = function () {
    return true;
  };

  /**
   * Needed for contracts.
   * Counts the score, which is correct answers subtracted by wrong answers.
   *
   * @returns {Number} score The amount of points achieved.
   */
  C.prototype.getScore = function () {
    this.calculateScore();
    return ((this.correctAnswers - this.wrongAnswers) <= 0) ? 0 : (this.correctAnswers - this.wrongAnswers);
  };

  /**
   * Needed for contracts.
   * Gets max score for this task.
   *
   * @returns {Number} maxScore The maximum amount of points achievable.
   */
  C.prototype.getMaxScore = function () {
    return this.answers;
  };

  /**
   * Needed for contracts.
   * Display the evaluation of the task, with proper markings.
   */
  C.prototype.showSolutions = function () {
    this.showEvaluation();
    this.setAllMarks();
    this.removeButtons();
    this.setAllSelectable(false);
  };

  /**
   * Remove the buttons in buttonContainer. Used to disable further input for user.
   */
  C.prototype.removeButtons = function () {
    this.$buttonContainer.hide();
  };

  /**
   * Private class for keeping track of selectable words.
   *
   * @param {String} word A string that will be turned into a selectable word.
   * @param {Object} $container The container which the word will be appended to.
   * @returns {String} html Returns a span with correct classes for the word.
   */
  function Word(word, $container) {
    var self = this;
    var input = word;
    var handledInput = word;
    var wordEnding = ' ';
    //Check if word is an answer
    var isAnswer = checkForAnswer();

    //Remove single asterisk and escape double asterisks.
    handleAsterisks();
    checkForPunctuation();

    var isSelectable = true;
    var isSelected = false;

    //Create jQuery object of word.
    var $word = $('<span /> ', {
      'class': SELECTABLE_MARK,
      html: handledInput
    }).appendTo($container).click(function () {
      if (!isSelectable){
        return;
      }
      self.toggleMark();
    });

    //Append a space after the word.
    $container.append(wordEnding);

    /**
     * Checks if the word is an answer by checking the first, second to last and last character of the word.
     * @private
     * @return {Boolean} Returns true if the word is an answer.
     */
    function checkForAnswer() {
      var self = this;
      //Check last and next to last character, in case of punctuations.
      var wordString = removeDoubleAsterisks(input);
      if (wordString.charAt(0) === ('*') && wordString.length > 2){
        if (wordString.charAt(wordString.length - 1) === ('*')){
          handledInput = input.slice(1, input.length - 1);
          return true;
        }
        // If punctuation, add the punctuation to the end of the word.
        else if(wordString.charAt(wordString.length - 2) === ('*')) {
          handledInput = input.slice(1, input.length - 2);
          wordEnding = input.charAt(input.length - 1) + ' ';
          return true;
        }
        return false;
      }
      return false;
    }

    /**
     * Checks if the word has a punctuation at the ending, and make sure this part is not a part of the word.
     * @private
     */
    function checkForPunctuation() {
      var self = this;
      var punctuations = new RegExp(/[.,\-!$%;:=-_`~]/);
      if (punctuations.test(handledInput.charAt(handledInput.length-1))) {
        wordEnding = handledInput.charAt(handledInput.length-1)+' ';
        handledInput = handledInput.slice(0, handledInput.length-1);
      }
    }

    /**
     * Removes double asterisks from string, used to handle input.
     * @private
     * @param {String} wordString The string which will be handled.
     * @results {String} slicedWord Returns a string without double asterisks.
     */
    function removeDoubleAsterisks(wordString) {
      var asteriskIndex = wordString.indexOf('*');
      var slicedWord = wordString;
      while (asteriskIndex !== -1){
        if (wordString.indexOf('*', asteriskIndex + 1) === asteriskIndex + 1) {
           slicedWord = wordString.slice(0, asteriskIndex) + wordString.slice(asteriskIndex + 2, input.length);
        }
        asteriskIndex = wordString.indexOf('*', asteriskIndex + 1);
      }
      return slicedWord;
    }

    /**
     * Escape double asterisks ** = *, and remove single asterisk.
     * @private
     */
    function handleAsterisks() {
      var asteriskIndex = handledInput.indexOf('*');
      while (asteriskIndex !== -1){
        handledInput = handledInput.slice(0, asteriskIndex) + handledInput.slice(asteriskIndex + 1, handledInput.length);
        asteriskIndex = handledInput.indexOf('*', asteriskIndex + 1);
      }
    }

    /**
     * Toggle the marking of a word.
     * @public
     */
    this.toggleMark = function () {
      $word.toggleClass(SELECTED_MARK);
      isSelected = !isSelected;
    };

    /**
     * Clears all marks from the word.
     * @public
     */
    this.markClear = function () {
      $word.removeClass(MISSED_MARK)
        .removeClass(CORRECT_MARK)
        .removeClass(WRONG_MARK)
        .removeClass(SELECTED_MARK);
      isSelected = false;
    };

    /**
     * Sets correct styling if word is an answer.
     * @public
     */
    this.showSolution = function () {
      $word.removeClass(MISSED_MARK)
        .removeClass(CORRECT_MARK)
        .removeClass(WRONG_MARK)
        .removeClass(SELECTED_MARK);
      if (isAnswer) {
        $word.addClass(CORRECT_MARK);
      }
    };

    /**
     * Check if the word is correctly marked and style it accordingly.
     * @public
     */
    this.markCheck = function () {
      if (isSelected) {
        if (isAnswer) {
          $word.addClass(CORRECT_MARK);
        }
        else {
          $word.addClass(WRONG_MARK);
        }
      }
      else if (isAnswer) {
        $word.addClass(MISSED_MARK);
      }
      $word.removeClass(SELECTED_MARK);
    };

    /**
     * Set whether the word should be selectable.
     * @public
     * @param {Boolean} selectable Set to true to make word selectable.
     */
    this.setSelectable = function (selectable) {
      isSelectable = selectable;
    };

    /**
     * Checks if the word is marked correctly.
     * @public
     * @returns {Boolean} True if the marking is correct.
     */
    this.isCorrect = function () {
      return (isAnswer && isSelected);
    };

    /**
     * Checks if the word is marked wrong.
     * @public
     * @returns {Boolean} True if the marking is wrong.
     */
    this.isWrong = function () {
      return (!isAnswer && isSelected);
    };

    /**
     * Checks if the word is correct, but has not been marked.
     * @public
     * @returns {Boolean} True if the marking is missed.
     */
    this.isMissed = function () {
      return (isAnswer && !isSelected);
    };

    /**
     * Checks if the word is an answer.
     * @public
     * @returns {Boolean} True if the word is an answer.
     */
    this.isAnswer = function () {
      return isAnswer;
    };

    /**
     * Checks if the word is selected.
     * @public
     * @returns {Boolean} True if the word is selected.
     */
    this.isSelected = function () {
      return isSelected;
    }
  }

    return C;
})(H5P.jQuery);