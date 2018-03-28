var H5PPresave = H5PPresave || {};

/**
 * Resolve the presave logic for the content type Mark the Words
 *
 * @param {object} content
 * @param finished
 * @constructor
 */
H5PPresave['H5P.MarkTheWords'] = function (content, finished) {
  var presave = H5PEditor.Presave;
  var score = 0;

  if (isContentValid()) {
    var pattern = /\*[^\*\s]+\*/g;
    score = content.textField.match(pattern || []).length;
  }

  presave.validateScore(score);

  if (finished) {
    finished({maxScore: score});
  }

  /**
   * Check if required parameters is present
   * @return {boolean}
   */
  function isContentValid() {
    return presave.checkNestedRequirements(content, 'content.textField');
  }
};
