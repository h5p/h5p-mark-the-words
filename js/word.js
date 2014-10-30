var H5P = H5P || {};

/**
 * Mark The Words module
 * @external {jQuery} $ H5P.jQuery
 */
H5P.MarkTheWords = (function ($) {

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
      tryAgain: "Retry"
    }, params);
  }

  /**
   * Append field to wrapper.
   * @param {jQuery} $container the jQuery object which this module will attach itself to.
   */
  C.prototype.attach = function ($container) {
    this._$inner = $container.addClass('h5p-word').html('<div class="h5p-word-inner"><div class="h5p-word-title">' + this.params.taskDescription + '</div></div>').children();
    this.addTaskTo(this._$inner);

    // Add "Check" and "Retry" button.
    this.addFooter();
  };
  
  /**
   * Handle task and add it to container.
   * @param {jQuery} $container The object which our task will attach to.
   */
  C.prototype.addTaskTo = function ($container) {
    var self = this;
    var textField = self.params.textField;
    var selectableHTML = '';
    self.selectableWords = [];
    self.isSelectable = true;

    //Regexp for splitting string on whitespace(s).
    var selectableStrings = textField.replace(/(\r\n|\n|\r)/gm," <br> ").split(/[\s]+/);

    var $barForSelectables = $('<div/>', {'class': 'h5p-selectables-bar'});
    //Make each word selectable
    selectableStrings.forEach(function (entry) {
      var selectableWord = new Word(entry, $barForSelectables);
      self.selectableWords.push(selectableWord);
      //selectableHTML += selectableWord.getSpan()+' ';
    });

    $barForSelectables.appendTo($container);
  };
  /**
   * Append footer to inner block.
   */
  C.prototype.addFooter = function () {
    console.log("Adding footer");
    console.log(this);
    this._$footer = $('<div class="h5p-word-footer"><div class="h5p-word-evaluation-container"></div></div>').appendTo(this._$inner);
    this.addButtons();
  };

  /**
   * Add check solution and retry buttons.
   */
  C.prototype.addButtons = function () {
    var self = this;

    var $buttonBar = $('<div/>', {'class': 'h5p-button-bar'});

    var $checkAnswerButton = $('<button/>', {
      class: 'h5p-check-button',
      type: 'button',
      text: this.params.checkAnswer
    }).appendTo($buttonBar).click(function () {
      self.markResults();
      if (self.markEvaluation()) {
        $checkAnswerButton.toggle();
        self.isSelectable = false;
        return;
      }
      $retryButton.toggle();
      $checkAnswerButton.toggle();
      self.isSelectable = false;
    });

    var $retryButton =  $('<button/>', {
      class: 'h5p-retry-button',
      type: 'button',
      text: this.params.tryAgain
    }).appendTo($buttonBar).click(function () {
      self.markClear();
      self.hideEvaluation();
      $retryButton.toggle();
      $checkAnswerButton.toggle();
      self.isSelectable = true;
    });

    $buttonBar.appendTo(this._$footer);
  };

  /**
   * Mark which answers are correct, wrong and missed.
   */
  C.prototype.markResults = function () {
    this._$inner.find(".h5p-word-selectable").each(function () {
      if ($(this).hasClass("h5p-word-selected") && $(this).hasClass("h5p-word-answer")){
        $(this).removeClass("h5p-word-selected");
        $(this).addClass("h5p-word-correct")
      }
      else if ($(this).hasClass("h5p-word-selected")) {
        $(this).removeClass("h5p-word-selected");
        $(this).addClass("h5p-word-wrong");
      }
      else if ($(this).hasClass("h5p-word-answer")) {
        $(this).addClass("h5p-word-missed");
      }
    });
  };

  /**
   * Evaluate task and display score text for word markings.
   * @return {Boolean} Returns true if maxScore was achieved.
   */
  C.prototype.markEvaluation = function () {
    this.hideEvaluation();
    var maxScore = this.totalAnswers;
    // answers contain correct, wrong and missed answers.
    var answers = this.getAnswers();
    var correctAnswers = answers[0];
    var wrongAnswers = answers[1];
    var missed = answers[2];
    var score = correctAnswers-wrongAnswers<=0 ? 0 : correctAnswers-wrongAnswers;

    //If score does not equal maxScore, show retry button.
    //this.SHOW_RETRY_BUTTON = score !== maxScore;
    this._$evaluation = this._$footer.find('.h5p-word-evaluation-container');
    this._$evaluationScore = $('<div class="h5p-word-evaluation-score">' + 'Score : '+ score+ ' of '+maxScore + ', correct:'+ correctAnswers+
    ', wrongAnswers: '+wrongAnswers+', missed: '+missed+'</div>').appendTo(this._$evaluation);

    return score === maxScore;
  };

  /**
   * Returns the correct, wrong and missed answers for the word marking.
   * @returns {Array} An array containing correct, wrong and missed answers.
   */
  C.prototype.getAnswers = function () {
    var correctAnswers = 0;
    var wrongAnswers = 0;
    var missed = 0;
    this._$inner.find(".h5p-word-selectable").each(function () {
      if ($(this).hasClass("h5p-word-correct")){
        correctAnswers += 1;
      }
      else if ($(this).hasClass("h5p-word-wrong")) {
        wrongAnswers += 1;
      }
      else if ($(this).hasClass("h5p-word-missed")) {
        missed += 1;
      }
    });
    return [correctAnswers, wrongAnswers, missed];
  };


  /**
   * Remove the evaluation text.
   */
  C.prototype.hideEvaluation = function () {
    // Clear evaluation section.
    this._$footer.find('.h5p-word-evaluation-container').html('');
  };

  /**
   * Clear styling on marked words.
   */
  C.prototype.markClear = function () {
    this._$inner.find(".h5p-word-selectable").each(function () {
      if ($(this).hasClass("h5p-word-missed")){
        $(this).removeClass("h5p-word-missed");
      }
      else if ($(this).hasClass("h5p-word-correct")) {
        $(this).removeClass("h5p-word-correct");
      }
      else if ($(this).hasClass("h5p-word-wrong")) {
        $(this).removeClass("h5p-word-wrong");
      }
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
    var self = this;
    var isAnswer = handleInput(word);
    var input = handleAsterisks(word);
    var isSelectable = true;
    var isSelected = false;
    var $word = $('<span /> ', {
      class: 'h5p-word-selectable',
      html: input
    }).append(' ').appendTo($container);
    $word.click(function () {
      if (!isSelectable){
        return;
      }
      $word.toggleClass('h5p-word-selected');
    });
    if (isAnswer) {
      $word.addClass('h5p-word-answer');
    }

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
    };

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
    };

    /**
     * Clears all marks from the word.
     * @public
     */
    this.clearMarks = function () {
      if ($word.hasClass("h5p-word-missed")){
        $word.removeClass("h5p-word-missed");
      }
      else if ($word.hasClass("h5p-word-correct")) {
        $word.removeClass("h5p-word-correct");
      }
      else if ($word.hasClass("h5p-word-wrong")) {
        $word.removeClass("h5p-word-wrong");
      }
    };

    /**
     * Sets the word as wrong.
     * @public
     */
    this.setWrong = function () {
      return;
    };

    /**
     * Returns a selectable span containing the word.
     * @public
     * @returns {String} Selectable span as HTML.
     */
    //this.getSpan = function () {
    //  return $word[0].outerHTML;
    //};

  }

    return C;
})(H5P.jQuery);