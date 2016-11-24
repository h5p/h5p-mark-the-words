/**
 * Mark the words XapiGenerator
 */
H5P.MarkTheWords.XapiGenerator = (function ($) {

  /**
   * Xapi statements Generator
   * @param {H5P.MarkTheWords} markTheWords
   * @constructor
   */
  function XapiGenerator(markTheWords) {

    /**
     * Generate answered event
     * @return {H5P.XAPIEvent}
     */
    this.generateAnsweredEvent = function () {
      var xAPIEvent = markTheWords.createXAPIEventTemplate('answered');

      // Extend definition
      var objectDefinition = createDefinition(markTheWords);
      $.extend(xAPIEvent.getVerifiedStatementValue(['object', 'definition']), objectDefinition);

      // Set score
      xAPIEvent.setScoredResult(markTheWords.getScore(),
        markTheWords.getMaxScore(),
        markTheWords,
        true,
        markTheWords.getScore() === markTheWords.getMaxScore()
      );

      // Extend user result
      var userResult = {
        response: getUserSelections(markTheWords)
      };

      $.extend(xAPIEvent.getVerifiedStatementValue(['result']), userResult);

      return xAPIEvent;
    }
  }

  /**
   * Create object definition for question
   *
   * @param {H5P.MarkTheWords} markTheWords
   * @return {Object} Object definition
   */
  function createDefinition(markTheWords) {
    var definition = {};
    definition.description = {
      'en-US': $('<div>' + markTheWords.params.taskDescription + '</div>').text()
    };
    definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';
    definition.interactionType = 'long-choice';
    definition.correctResponsesPattern = [getCorrectResponsesPattern(markTheWords)];
    definition.choices = getChoices(markTheWords);
    return definition;
  }

  /**
   * Get all choices that it is possible to choose between
   *
   * @param {H5P.MarkTheWords} markTheWords
   * @return {Array}
   */
  function getChoices(markTheWords) {
    return markTheWords.selectableWords.map(function (word, index) {
      var text = word.getText();
      if (text.charAt(0) === '*' && text.charAt(text.length - 1) === '*') {
        text = text.substr(1, text.length - 2);
      }

      return {
        id: index,
        description: {
          'en-US': $('<div>' + text + '</div>').text()
        }
      }
    })
  }

  /**
   * Get selected words as a user response pattern
   *
   * @param {H5P.MarkTheWords} markTheWords
   * @return {string}
   */
  function getUserSelections(markTheWords) {
    return markTheWords.selectableWords
      .reduce(function (prev, word, index) {
        if (word.isSelected()) {
          prev.push(index);
        }
        return prev;
      }, []).join('[,]');
  }

  /**
   * Get correct response pattern from correct words
   *
   * @param {H5P.MarkTheWords} markTheWords
   * @return {string}
   */
  function getCorrectResponsesPattern(markTheWords) {
    return markTheWords.selectableWords
      .reduce(function (prev, word, index) {
        if (word.isAnswer()) {
          prev.push(index);
        }
        return prev;
      }, []).join('[,]');
  }

  return XapiGenerator;
}(H5P.jQuery));
