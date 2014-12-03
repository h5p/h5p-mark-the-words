var H5PUpgrades = H5PUpgrades || {};

H5PUpgrades['H5P.MarkTheWords'] = (function ($) {
  return {
    1: {
      1: {
        contentUpgrade: function (parameters, finished) {
          // Moved all behavioural settings into "behaviour" group.
          parameters.behaviour = {
            enableRetry: parameters.enableRetry,
            enableSolutionsButton: parameters.enableSolutionsButton
          };
          delete parameters.enableRetry;
          delete parameters.enableSolutionsButton;
          finished(null, parameters);
        }
      }
    }
  };
})(H5P.jQuery);