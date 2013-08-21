(function(){

    window.Transcripts = window.Transcripts || {};
    window.Transcripts.Metadata = window.Transcripts.Metadata || {};

    window.Transcripts.Editor = Backbone.View.extend({

        tagName: "div",

        events: {
        },

        initialize: function() {
            var metadataJSON = this.$el.data('metadata'),
                tpl = $("#metadata-editor-tpl").text(),
                counter = 0,
                self = this;

            if(!tpl) {
                console.error("Couldn't load basic metadata editor template");
            }

            this.collection = new CMS.Models.MetadataCollection(
                this.prepareMetadata(metadataJSON)
            );
            // this.collection = this.prepareMetadata(metadataJSON);

            this.template = _.template(tpl);

            this.$el.html(this.template({numEntries: this.collection.length}));

            this.collection.each(
                function (model) {
                    var data = {
                            el: self.$el.find('.metadata_entry')[counter++],
                            model: model,
                            syncElement: ".metadata_edit ." + model.getFieldName()
                        },
                        type = model.getType();

                    if (Transcripts.Metadata[type]) {
                        new Transcripts.Metadata[type](data);
                    }

            });

        },

        render: function() {
        },

        prepareMetadata: function(json){
            var metadata = JSON.parse(json),
                models = [];

            for (model in metadata){
                if (metadata.hasOwnProperty(model)) {
                    models.push(metadata[model]);
                }
            }

            return models;
        }

    });

    Transcripts.Metadata.AbstractEditor = Backbone.View.extend({

        // Model is CMS.Models.Metadata.
        initialize : function() {
            var self = this;
            var templateName = _.result(this, 'templateName');
            // Backbone model cid is only unique within the collection.
            this.uniqueId = _.uniqueId(templateName + "_");

            var tpl = document.getElementById(templateName).text;
            if(!tpl) {
                console.error("Couldn't load template: " + templateName);
            }
            this.template = _.template(tpl);

            this.$el.html(this.template({model: this.model, uniqueId: this.uniqueId}));
            this.listenTo(this.model, 'change', this.render);
            this.render();
        },

        /**
         * The ID/name of the template. Subclasses must override this.
         */
        templateName: '',

        /**
         * Returns the value currently displayed in the editor/view. Subclasses should implement this method.
         */
        getValueFromEditor : function () {},

        /**
         * Sets the value currently displayed in the editor/view. Subclasses should implement this method.
         */
        setValueInEditor : function (value) {},

        /**
         * Sets the value in the model, using the value currently displayed in the view.
         */
        updateModel: function () {
            this.model.setValue(this.getValueFromEditor());
            this.syncFields();
        },

        /**
         * Clears the value currently set in the model (reverting to the default).
         */
        clear: function () {
            this.model.clear();
        },

        /**
         * Shows the clear button, if it is not already showing.
         */
        showClearButton: function() {
            if (!this.$el.hasClass('is-set')) {
                this.$el.addClass('is-set');
                this.getClearButton().removeClass('inactive');
                this.getClearButton().addClass('active');
            }
        },

        /**
         * Returns the clear button.
         */
        getClearButton: function () {
            return this.$el.find('.setting-clear');
        },

        /**
         * Renders the editor, updating the value displayed in the view, as well as the state of
         * the clear button.
         */
        render: function () {
            if (!this.template) return;

            this.setValueInEditor(this.model.getDisplayValue());

            if (this.model.isExplicitlySet()) {
                this.showClearButton();
            }
            else {
                this.$el.removeClass('is-set');
                this.getClearButton().addClass('inactive');
                this.getClearButton().removeClass('active');
            }

            return this;
        },

        syncFields: function () {}
    });



    Transcripts.Metadata.String = CMS.Views.Metadata.AbstractEditor.extend({

        events : {
            "change input" : "updateModel",
            "keypress .setting-input" : "showClearButton"  ,
            "click .setting-clear" : "clear"
        },

        templateName: "transcripts-metadata-string-entry",

        initialize: function(){
            var self = this;

            this.$el.closest(".component-editor")
                .on(
                    "change",
                    this.options.syncElement,
                    function(){
                        self.setValueInEditor($(this).val());
                    }
                );

            return CMS.Views.Metadata.AbstractEditor.prototype.initialize.apply(this, arguments);
        },

        updateModel: function(){
            this.syncFields();

            return CMS.Views.Metadata.AbstractEditor.prototype.updateModel.apply(this, arguments);
        },

        getValueFromEditor : function () {
            var value = this.$el.find('#' + this.uniqueId).val();

            return value;
        },

        setValueInEditor : function (value) {
            this.$el.find('input').val(value);
        },

        syncFields: function () {
            var value = this.getValueFromEditor(),
                el = this.$el.closest(".component-editor")
                        .find(this.options.syncElement)
                        .closest('.metadata_entry'),
                metadataEditorView = el.data('metadataEditorView');

            if (metadataEditorView){
                metadataEditorView.setValueInEditor(value);
                metadataEditorView.updateModel();
            }
        }

    });



    Transcripts.Metadata.List = CMS.Views.Metadata.AbstractEditor.extend({

        events : {
            "click .setting-clear" : "clear",
            "keypress .setting-input" : "showClearButton",
            "change input" : "updateModel",
            "input input" : "enableAdd",
            "click .create-setting" : "addEntry",
            "click .remove-setting" : "removeEntry"
        },

        templateName: "transcripts-metadata-list-entry",

        initialize: function(){
            var self = this,
                selector = this.options.syncElement + ' input';

            console.log(selector);
            debugger
            this.$el.closest('.component-editor')
                .on(
                    'change',
                    selector,
                    function(){
                        debugger
                        var el = self.$el.closest('.component-editor')
                                .find(self.options.syncElement)
                                .closest('.metadata_entry'),
                            metadataEditorView = el.data('metadataEditorView'),
                            value;

                        if (metadataEditorView) {
                            value = metadataEditorView.getValueFromEditor();
                            self.setValueInEditor(value);
                        }
                    }
                );

            return CMS.Views.Metadata.AbstractEditor.prototype.initialize.apply(this, arguments);
        },

        updateModel: function(){
            this.syncFields();

            return CMS.Views.Metadata.AbstractEditor.prototype.updateModel.apply(this, arguments);
        },

        getValueFromEditor: function () {
            return _.map(
                this.$el.find('li input'),
                function (ele) { return ele.value.trim(); }
            ).filter(_.identity);
        },

        setValueInEditor: function (value) {
            var list = this.$el.find('ol');
            list.empty();
            _.each(value, function(ele, index) {
                var template = _.template(
                    '<li class="list-settings-item">' +
                        '<input type="text" class="input" value="<%= ele %>">' +
                        '<a href="#" class="remove-action remove-setting" data-index="<%= index %>"><i class="icon-remove-sign"></i><span class="sr">Remove</span></a>' +
                    '</li>'
                );
                list.append($(template({'ele': ele, 'index': index})));
            });
        },

        addEntry: function(event) {
            event.preventDefault();
            // We don't call updateModel here since it's bound to the
            // change event
            var list = this.model.get('value') || [];
            this.setValueInEditor(list.concat(['']))
            this.$el.find('.create-setting').addClass('is-disabled');
        },

        removeEntry: function(event) {
            event.preventDefault();
            var entry = $(event.currentTarget).siblings().val();
            this.setValueInEditor(_.without(this.model.get('value'), entry));
            this.updateModel();
            this.$el.find('.create-setting').removeClass('is-disabled');
        },

        enableAdd: function() {
            this.$el.find('.create-setting').removeClass('is-disabled');
        },

        syncFields: function () {

            var value = this.getValueFromEditor(),
                el = this.$el.closest(".component-editor")
                        .find(this.options.syncElement)
                        .closest('.metadata_entry'),
                metadataEditorView = el.data('metadataEditorView');

            if (metadataEditorView){
                metadataEditorView.setValueInEditor(value);
                metadataEditorView.updateModel();
            }

        }
    });

}());