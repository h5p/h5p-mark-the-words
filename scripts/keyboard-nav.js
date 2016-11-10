/*global H5P*/

/**
 * Mark The Words module
 * @external {jQuery} $ H5P.jQuery
 */
H5P.KeyboardNav = (function ($, EventDispatcher) {
  var elements = [];

  /**
   * Initialize module.
   *
   * @class H5P.KeyboardNav
   * @extends H5P.EventDispatcher
   *
   * @returns {Object} KeyboardNav Navigate a set of elements
   */
  function KeyboardNav() {
    var self = this;
    EventDispatcher.call(self);
  }

  KeyboardNav.prototype = Object.create(EventDispatcher.prototype);
  KeyboardNav.prototype.constructor = KeyboardNav;

  /**
   * Adds a element to navigation
   *
   * @param {jQuery} $el The element
   */
  KeyboardNav.prototype.addElement = function(el){
    var $el = $(el);
    $el.keydown(this.handleKeyDown.bind(this));
    $el.click(this.onClick.bind(this));

    // add to array to navigate over
    elements.push(el);

    if(elements.length === 1){ // if first
      this.setTabbableAt(0);
    }
  };

  KeyboardNav.prototype.handleKeyDown = function(event){
    switch (event.which) {
      case 13: // Enter
      case 32: // Space
        // Select
        this.toggleSelect(event.target);
        //event.preventDefault();
        break;

      case 37: // Left Arrow
      case 38: // Up Arrow
        // Go to previous Option
        this.previousOption(event.currentTarget);
        event.preventDefault();
        break;

      case 39: // Right Arrow
      case 40: // Down Arrow
        // Go to next Option
        this.nextOption(event.currentTarget);
        event.preventDefault();
        break;
    }
  };

  KeyboardNav.prototype.previousOption = function (el) {
    var index = elements.indexOf(el);
    this.focusOnElementAt(isFirstElement(index) ? (elements.length - 1) : (index - 1));
    this.trigger('previousOption', createEventPayload(el));
  };

  KeyboardNav.prototype.nextOption = function (el) {
    var index = elements.indexOf(el);
    this.focusOnElementAt(isLastElement(index) ? 0 : (index + 1));
    this.trigger('nextOption', createEventPayload(el));
  };

  /**
   * Focus on an alternative by index
   *
   * @param {Number} index The index of the alternative to focus on
   */
  KeyboardNav.prototype.focusOnElementAt = function (index) {
    this.removeAllTabbable();
    this.setTabbableAt(index);
    var $el = $(elements[index]);
    $el.focus();
  };

  /**
   * Remove tabbable from all entries
   */
  KeyboardNav.prototype.setTabbableAt = function (index) {
    $(elements[index]).attr('tabindex', 0);
  };

  /**
   * Remove tabbable from all entries
   */
  KeyboardNav.prototype.removeAllTabbable = function () {
    elements.forEach(function(el){ $(el).removeAttr('tabindex'); });
  };

  KeyboardNav.prototype.toggleSelect = function(el){
    var $el = $(el);

    // toggle selection
    if(isElementSelected($el)){
      $el.removeAttr('aria-selected');
    }
    else {
      $el.attr('aria-selected', true);
    }

    // focus current
    $el.attr('tabindex', 0);
    $el.focus();

    // fire select event
    this.trigger('select', createEventPayload(el));
  };

  KeyboardNav.prototype.onClick = function(event){
    this.toggleSelect(event.currentTarget);
  };

  var createEventPayload = function(el){
    return {
      element: el,
      index: elements.indexOf(el),
      selected: isElementSelected($(el))
    };
  };

  var isElementSelected = function($el){
    return $el.attr('aria-selected') === 'true';
  };

  var isFirstElement = function(index){
    return index === 0;
  };

  var isLastElement = function(index){
    return index === elements.length - 1;
  };

  return KeyboardNav;
})(H5P.jQuery, H5P.EventDispatcher);