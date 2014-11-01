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


  /**
   * Initialize module.
   * @param {Object} params Behavior settings
   * @param {Number} id Content identification
   * @returns {Object} C Mark the words instance
   */
  function C(params, id) {
    this.$ = $(this);
    this.id = id;

    // Set default behavior.
    this.params = $.extend({}, {
      taskDescription: "Highlight the adjectives in the following sentence",
      textField: "This is a *nice*, *flexible* content type, which allows you to highlight all the *wonderful* words in this *exciting* sentence.\n"+
        "This is another line of *fantastic* text.",
      checkAnswer: "Check",
      tryAgain: "Retry",
      score: "Score : @score of @total, correct: @correct, wrong: @wrong, missed: @missed."
    }, params);
  }

  /**
   * Append field to wrapper.
   * @param {jQuery} $container the jQuery object which this module will attach itself to.
   */
  C.prototype.attach = function ($container) {
    this._$inner = $container.addClass(MAIN_CONTAINER).html('<div class='+INNER_CONTAINER+'><div class='+TITLE_CONTAINER+'>' + this.params.taskDescription + '</div></div>').children();
    this.addTaskTo(this._$inner);

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
    this._$footer = $('<div class='+FOOTER_CONTAINER+'></div>').appendTo(this._$inner);
    this._$evaluation = $('<div class='+EVALUATION_CONTAINER+'></div>').appendTo(this._$footer);
    this.addButtons();
  };

  /**
   * Add check solution and retry buttons.
   */
  C.prototype.addButtons = function () {
    console.log(this);
    var self = this;
    var $buttonContainer = $('<div/>', {'class': BUTTON_CONTAINER});

    var $checkAnswerButton = $('<button/>', {
      class: BUTTONS+' '+CHECK_BUTTON,
      type: 'button',
      text: this.params.checkAnswer
    }).appendTo($buttonContainer).click(function () {
      self.setAllSelectable(false);
      self.setAllMarks();
      $checkAnswerButton.toggle();
      if (!self.showEvaluation()) {
        $retryButton.toggle();
      }
    });

    var $retryButton =  $('<button/>', {
      class: BUTTONS+' '+RETRY_BUTTON,
      type: 'button',
      text: this.params.tryAgain
    }).appendTo($buttonContainer).click(function () {
      self.clearAllMarks();
      self.hideEvaluation();
      self.setAllSelectable(true);
      $retryButton.toggle();
      $checkAnswerButton.toggle();
    });
    $buttonContainer.appendTo(this._$footer);
  };

  /**
   * Set whether all the words should be selectable.
   * @public
   * @param {Boolean} Set to true to make the words selectable.
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
   * Evaluate task and display score text for word markings.
   * @return {Boolean} Returns true if maxScore was achieved.
   */
  C.prototype.showEvaluation = function () {
    this.hideEvaluation();
    var maxScore = this.answers;
    var correctAnswers = 0;
    var wrongAnswers = 0;
    var missedAnswers = 0;
    this.selectableWords.forEach(function (entry) {
      if(entry.isCorrect()) {
        correctAnswers += 1;
      }
      else if(entry.isWrong()) {
        wrongAnswers += 1;
      }
      else if(entry.isMissed()) {
        missedAnswers += 1;
      }
    });
    var score = correctAnswers-wrongAnswers<=0 ? 0 : correctAnswers-wrongAnswers;

    //replace editor variables with values, uses regexp to replace all instances.
    var scoreText = this.params.score.replace(/@score/g, score.toString()).replace(/@total/g, maxScore.toString()).replace(/@correct/g, correctAnswers.toString());
    scoreText = scoreText.replace(/@wrong/g, wrongAnswers.toString()).replace(/@missed/g, missedAnswers.toString());
    //Append evaluation emoticon and score to evaluation container.
    $('<div class='+EVALUATION_EMOTICON+'></div>').appendTo(this._$evaluation);
    this._$evaluationScore = $('<div class=' + EVALUATION_SCORE + '>' + scoreText + '</div>').appendTo(this._$evaluation);
    if (score === maxScore) {
      this._$evaluation.addClass(EVALUATION_EMOTICON_MAX_SCORE);
    }
    else {
      this._$evaluation.removeClass(EVALUATION_EMOTICON_MAX_SCORE);
    }
    return score === maxScore;
  };

  /**
   * Clear the evaluation text.
   */
  C.prototype.hideEvaluation = function () {
    this._$evaluation.html('');
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
   * Always returns true, since MTW has no required actions to give an answer.
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
    var correctAnswers = 0;
    var wrongAnswers = 0;
    var missedAnswers = 0;
    this.selectableWords.forEach(function (entry) {
      if(entry.isCorrect()) {
        correctAnswers += 1;
      }
      else if(entry.isWrong()) {
        wrongAnswers += 1;
      }
    });
    return correctAnswers-wrongAnswers<=0 ? 0 : correctAnswers-wrongAnswers;
  };

  /**
   * Needed for contracts.
   * Gets max score for this task.
   *
   * @returns {Number} maxScore The maximum amount of points achievable.
   */
  C.prototype.getMaxScore = function () {
    var correctAnswers = 0;
    this.selectableWords.forEach(function (entry) {
      if(entry.isAnswer()) {
        correctAnswers += 1;
      }
    });
    return correctAnswers;
  };

  /**
   * Needed for contracts.
   * Display the correct solution for the input boxes.
   *
   */
  C.prototype.showSolutions = function () {
    this.selectableWords.forEach(function (entry) {
      entry.showSolution();
    });
  };

  /**
   * Private class for keeping track of selectable words.
   *
   * @param {String} word A string that will be turned into a selectable word.
   * @param {Object} $container The container which the word will be appended to.
   * @returns {String} html Returns a span with correct classes for the word.
   */
  function Word(word, $container) {
    //CSS Classes for marking words:
    var MISSED_MARK = 'h5p-word-missed';
    var CORRECT_MARK = 'h5p-word-correct';
    var WRONG_MARK = 'h5p-word-wrong';
    var SELECTED_MARK = 'h5p-word-selected';
    var SELECTABLE_MARK = 'h5p-word-selectable';

    var self = this;
    //Check if word is an answer
    var isAnswer = handleInput(word);

    //Remove single asterisk and escape double asterisks.
    var input = handleAsterisks(word);
    var isSelectable = true;
    var isSelected = false;

    //Create jQuery object of word.
    var $word = $('<span /> ', {
      class: SELECTABLE_MARK,
      html: input
    }).appendTo($container).click(function () {
      if (!isSelectable){
        return;
      }
      self.markWord();
    });

    //Append a space after the word.
    $container.append(' ');

    /**
     * Checks if the word is an answer by checking the first, second to last and last character of the word.
     * @private
     * @return {Boolean} Returns true if the word is an answer.
     */
    function handleInput(word) {
      //Check last and next to last character, in case of punctuations.
      word = removeDoubleAsterisks(word);
      if (word.charAt(0) === ('*') && word.length>2){
        if (word.charAt(word.length-1) === ('*')){
          return true;
        }
        else if(word.charAt(word.length-2) === ('*')) {
          return true;
        }
        return false;
      }
      return false;
    }

    /**
     * Removes double asterisks from string, used to handle input.
     * @private
     * @param {String} string The string which will be handled.
     * @results {String} string Returns a string without double asterisks.
     */
    function removeDoubleAsterisks(string) {
      var asteriskIndex = string.indexOf('*');
      while (asteriskIndex !== -1){
        if (string.indexOf('*',asteriskIndex+1) === asteriskIndex+1) {
          string = string.slice(0, asteriskIndex)+string.slice(asteriskIndex+2, string.length);
        }
        asteriskIndex = string.indexOf('*', asteriskIndex+1);
      }
      return string;
    }

    /**
     * Escape double asterisks ** = *, and remove single asterisk.
     * @private
     * @param {String} string The string which will be handled.
     * @results {String} string Returns a string with handled asterisks.
     */
    function handleAsterisks(string) {
      var asteriskIndex = string.indexOf('*');
      while (asteriskIndex !== -1){
        string = string.slice(0, asteriskIndex)+string.slice(asteriskIndex+1, string.length);
        asteriskIndex = string.indexOf('*', asteriskIndex+1);
      }
      return string;
    }
    /**
     * Sets the styling of the word as the supplied marking.
     * @private
     * @param {String} markClass The css class to mark the word with.
     */
    function setMark(markClass) {
      $word.addClass(markClass);
    }

    /**
     * Sets the styling of the word as the supplied marking.
     * @private
     * @param {String} markClass The css class to mark the word with.
     */
    function removeMark(markClass) {
      $word.removeClass(markClass);
    }

    /**
     * Toggle the marking of a word.
     * @public
     */
    this.markWord = function () {
      $word.toggleClass(SELECTED_MARK);
      isSelected = !isSelected;
    };

    /**
     * Clears all marks from the word.
     * @public
     */
    this.markClear = function () {
      removeMark(MISSED_MARK);
      removeMark(CORRECT_MARK);
      removeMark(WRONG_MARK);
      removeMark(SELECTED_MARK);
      isSelected = false;
    };

    /**
     * Sets correct styling if word is an answer.
     * @public
     */
    this.showSolution = function () {
      removeMark(MISSED_MARK);
      removeMark(CORRECT_MARK);
      removeMark(WRONG_MARK);
      removeMark(SELECTED_MARK);
      if (isAnswer) {
        setMark(CORRECT_MARK);
      }
    }

    /**
     * Check if the word is correctly marked and style it accordingly.
     * @public
     */
    this.markCheck = function () {
      if (isSelected) {
        if (isAnswer) {
          setMark(CORRECT_MARK);
        }
        else {
          setMark(WRONG_MARK);
        }
      }
      else if (isAnswer) {
        setMark(MISSED_MARK);
      }
      removeMark(SELECTED_MARK);
    };

    /**
     * Set whether the word should be selectable.
     * @public
     * @param {Boolean} Set to true to make word selectable.
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
      if (isAnswer && isSelected) {
        return true;
      }
      return false;
    };

    /**
     * Checks if the word is marked wrong.
     * @public
     * @returns {Boolean} True if the marking is wrong.
     */
    this.isWrong = function () {
      if (!isAnswer && isSelected) {
        return true;
      }
      return false;
    };

    /**
     * Checks if the word is correct, but has not been marked.
     * @public
     * @returns {Boolean} True if the marking is missed.
     */
    this.isMissed = function () {
      if (isAnswer && !isSelected) {
        return true;
      }
      return false;
    };

    /**
     * Checks if the word is an answer.
     * @public
     * @returns {Boolean} True if the word is an answer.
     */
    this.isAnswer = function () {
      if (isAnswer) {
        return true;
      }
      return false;
    };
  }

    return C;
})(H5P.jQuery);