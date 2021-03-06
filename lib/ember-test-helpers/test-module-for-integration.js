import Ember from 'ember';
import TestModule from './test-module';
import { getResolver } from './test-resolver';
import { getContext, setContext } from './test-context';

export default TestModule.extend({

  isIntegration: true,

  init: function(name, description, callbacks) {
    this._super.call(this, name, description, callbacks);
    this.setupSteps.push(this.setupIntegrationHelpers);
    this.teardownSteps.push(this.teardownView);
  },

  setupIntegrationHelpers: function() {
    var self = this;
    var context = this.context;
    context.dispatcher = Ember.EventDispatcher.create();
    context.dispatcher.setup({}, '#ember-testing');
    this.actionHooks = {};

    context.render = function(template) {
      if (Ember.isArray(template)) {
        template = template.join('');
      }
      if (typeof template === 'string') {
        template = Ember.Handlebars.compile(template);
      }
      self.view = Ember.View.create({
        context: context,
        controller: self,
        template: template,
        container: self.container
      });
      Ember.run(function() {
        self.view.appendTo('#ember-testing');
      });
    };

    context.$ = function() {
      return self.view.$.apply(self.view, arguments);
    };

    context.set = function(key, value) {
      Ember.run(function() {
        Ember.set(context, key, value);
      });
    };

    context.get = function(key) {
      return Ember.get(context, key);
    };

    context.on = function(actionName, handler) {
      self.actionHooks[actionName] = handler;
    };

  },

  setupContext: function() {

    setContext({
      container:  this.container,
      factory: function() {},
      dispatcher: null
    });

    this.context = getContext();
  },

  send: function(actionName) {
    var hook = this.actionHooks[actionName];
    if (!hook) {
      throw new Error("integration testing template received unexpected action " + actionName);
    }
    hook.apply(this, Array.prototype.slice.call(arguments, 1));
  },

  teardownView: function() {
    var view = this.view;
    if (view) {
      Ember.run(function() {
        view.destroy();
      });
    }
  }

});
