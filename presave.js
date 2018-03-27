var H5PPresave = H5PPresave || {};

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

  function isContentValid() {
    return presave.checkNestedRequirements(content, 'content.textField');
  }
};
