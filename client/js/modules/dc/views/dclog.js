define(['marionette'], function(Marionette) {


    var LogItem = Marionette.ItemView.extend({
        tagName: 'li',
        getTemplate: function() {
            var temps = {
                data: '<span class="title">New data collection</span> <a href="#"><%=DIR%><%=FILETEMPLATE%></a>',
                edge: '<span class="title">New edge scan</span> <a href="#"><%=DIR%> Edge Scan</a>',
                mca: '<span class="title">New MCA fluorescence spectrum</span> <a href="#"><%=DIR%> Fluorescence spectrum</a>',
                load: '<span class="title">New sample loaded</span> <a href="#">Puck: <%=EXPOSURETIME%> Pin: <%=RESOLUTION%> Barcode: <%=DIR%></a>',
            }
            
            return _.template(this.model.get('ST').replace(/\d+-\d+-\d+ /, '')+' - '+temps[this.model.get('TYPE')])
        },
        
        events: {
            'click a': 'gotoEvent'
        },
        
        gotoEvent: function(e) {
            e.preventDefault()
            var pos = $('.data_collection[dcid="'+this.model.get('ID')+'"]').offset().top
            $('body').animate({scrollTop: pos}, 300);
        },
    })
    
    
    
    return Marionette.CompositeView.extend({
        template: _.template('<h1>Log</h1><ul></ul>'),
        className: 'log border',
        childView: LogItem,
        childViewContainer: 'ul',
    })


})