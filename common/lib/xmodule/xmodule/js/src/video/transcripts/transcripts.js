(function(){
    var Sync = function(element, relations){
        // #TODO: Check if all params exist
        this.$el = element;
        this.$container = this.$el.closest(".component-editor");
        this.relations = relations;
    };

    Sync.prototype.sync = function(){
        var elementsList = this.relations,
            val;

        $.each(elementsList, function(index, items){
            $.each(items, function(index, items){
    // debugger
                for (obj in items) {
                    if (item.hasOwnProperty(obj)) {

                        var el = this.$el.closest(".component-editor")
                                    .find(obj.selector),
                            val = null;

                        el.on("change", function(){
                            var list = _.without(items, obj);
                            $.each(list, function(item, index){
                                var value = (obj.getValue)
                                                ? obj.getValue()
                                                : el.val();

                                $(item.selector).val(value);
                            })
                        });

                    }
                }
            });
        });
        // for (element in elementsList){
        //     if (elementsList.hasOwnProperty(element)) {
        //         var el = this.$el.closest(".component-editor")
        //                     .find(elementsList[element]);
        //         val = this.$el.find('.' + element).val();
        //         el.val(val);
        //     }
        // }
    };

    window.Transcripts = window.Transcripts || {};

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
                            model: model
                        },
                        type = model.getType();

                    if (CMS.Views.Metadata[type]) {
                        new CMS.Views.Metadata[type](data);
                    }

            });

            // var sync = new Sync(
            //     this.$el,
            //     [
            //         [
            //             {
            //                 selector: ".basic_metadata_edit .display_name",
            //                 getValue: function () { return 'aaa'}
            //             },
            //             {
            //                 selector: ".metadata_edit .display_name",
            //                 getValue: function () { return 'bbb'}
            //             }
            //         ]
            //     ]
            // );

            // this.$el.on('change', 'input', sync.sync.bind(sync));

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

    // Transcripts.Metadata.String = CMS.Views.Metadata.String.extend({});
    // Transcripts.Metadata.List = CMS.Views.Metadata.List.extend({});

}());