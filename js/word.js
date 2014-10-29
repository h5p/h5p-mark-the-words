var H5P = H5P || {};

/**
 * Mark The Words module
 * @external {jQuery} $
 */
H5P.MarkTheWords = (function ($) {
  var SHOW_CHECK_BUTTON = true;
  var SHOW_RETRY_BUTTON = false;

  /**
   * Initialize module.
   *
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
      textField: [
        "This is a *nice*, *flexible* content type, which allows you to highlight all the *wonderful* words in this *exciting* sentence.\n"+
        "This is another line of *fantastic* text."
      ],
      checkAnswer: "Check",
      tryAgain: "Retry"
    }, params);
  }

  /**
   * Append field to wrapper.
   *
   * @param {jQuery} $container
   */
  C.prototype.attach = function ($container) {
    this._$inner = $container.addClass('h5p-word').html('<div class="h5p-inner"><div class="h5p-word-title">' + this.params.taskDescription + '</div></div>').children();
    this.appendQuestionsTo(this._$inner);

    // Add "Check" and "Retry" button.
    this.addFooter();
  };
  
  /**
   * Append textField to container.
   *
   * @param {jQuery} $container
   */
  C.prototype.appendQuestionsTo = function ($container) {
    var self = this;
    var textField = self.params.textField;
    var selectableHTML = '';
    self.totalAnswers = 0;

    //Regexp for splitting string on newline, whitespace, comma, question mark, exclamation mark and period.
    var selectables = textField.replace('\n',' <br> ').split(/[\n\s,?!.]+/);

    //Make each word selectable
    selectables.forEach(function (entry) {
      //Handle asterix
      if (entry.indexOf('*') !== -1){
        //Mark answers
        if (entry[0] === ('*') && entry[entry.length-1] === ('*') && entry.length>2){
          selectableHTML += '<span class="h5p-word-selectable h5p-word-answer">' + entry.slice(1, entry.length-1) + '</span> ';
          self.totalAnswers += 1;
        }
        //Escape double asterix
        else {
          asterixIndex = entry.indexOf('*');
          while (asterixIndex !== -1){
            entry = entry.slice(0, asterixIndex)+entry.slice(asterixIndex+1, entry.length);
            asterixIndex = entry.indexOf('*', asterixIndex+1);
          }
          selectableHTML += '<span class="h5p-word-selectable">' + entry + '</span> ';
        }
      }
      else {
        selectableHTML += '<span class="h5p-word-selectable">' + entry + '</span> ';
      }
    });
    $container[0].innerHTML += '<div>' + selectableHTML + '</div>';

    // Select and de-select word when clicked.
    $(".h5p-word-selectable").click(function () {
      //Don't let the user select new words after having checked for solution.
      if (!SHOW_CHECK_BUTTON){
        return;
      }
      if ($(this).hasClass("h5p-word-selected")){
        $(this).removeClass("h5p-word-selected");
      }
      else {
        $(this).addClass("h5p-word-selected");
      }
    });
  };

    /**
     * Append footer to MarkTheWords block.
     */
    C.prototype.addFooter = function () {
      this._$footer = $('<div class="h5p-word-footer"><div class="h5p-word-evaluation-container"></div></div>').appendTo(this._$inner);
      this.addButtons();
    };

    /**
     * Add show solution button.
     */
    C.prototype.addButtons = function () {
      var self = this;

      var $buttonBar = $('<div/>', {'class': 'h5p-button-bar'});

      // Check answer button
      var $checkAnswerButton = $('<button/>', {
        'class': 'h5p-check-button',
        type: 'button',
        text: this.params.checkAnswer
      }).appendTo($buttonBar);

      $checkAnswerButton.click(function () {
        if (!SHOW_CHECK_BUTTON){
          return;
        }
        self.markResults();
        self.showEvaluation();
        if (!SHOW_RETRY_BUTTON) {
          $checkAnswerButton.toggle();
          return;
        }
        $checkAnswerButton.toggle();
        $retryButton.toggle();
        SHOW_CHECK_BUTTON = false;
      });

      var $retryButton =  $('<button/>', {
        'class': 'h5p-retry-button',
        type: 'button',
        text: this.params.tryAgain
      }).appendTo($buttonBar);

      $retryButton.click(function () {
        if (!SHOW_RETRY_BUTTON){
          return;
        }
        self.clearMarks();
        self.hideEvaluation();
        $retryButton.toggle();
        $checkAnswerButton.toggle();
        SHOW_CHECK_BUTTON = true;
        SHOW_RETRY_BUTTON = false;
      });

      $buttonBar.appendTo(this._$footer);

    };

    /**
     * Mark which answers are correct and which are wrong
     */
    C.prototype.markResults = function () {
      $(".h5p-word-selectable").each(function () {
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
   * Display evaluation of score.
   */
  C.prototype.showEvaluation = function () {
    this.hideEvaluation();

    var correctAnswers = 0;
    var wrongAnswers = 0;
    var missed = 0;
    var maxScore = this.totalAnswers;
    $(".h5p-word-selectable").each(function () {
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
    var score = correctAnswers-wrongAnswers<=0 ? 0 : correctAnswers-wrongAnswers;
    SHOW_RETRY_BUTTON = true;
    if (score === maxScore) {
      SHOW_RETRY_BUTTON = false;
    }
    this._$evaluation = this._$footer.find('.h5p-word-evaluation-container');
    this._$evaluationScore = $('<div class="h5p-word-evaluation-score">' + 'Score : '+ score+ ' of '+maxScore + ', correct:'+ correctAnswers+
    ', wrongAnswers: '+wrongAnswers+', missed: '+missed+'</div>').appendTo(this._$evaluation);
  };

  /**
   * Hide the evaluation widget
   */
  C.prototype.hideEvaluation = function () {
    // Clear evaluation section.
    this._$footer.find('.h5p-word-evaluation-container').html('');
  };

  /**
   * Clear marked selections.
   */
  C.prototype.clearMarks = function () {
    $(".h5p-word-selectable").each(function () {
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

    return C;
})(H5P.jQuery);