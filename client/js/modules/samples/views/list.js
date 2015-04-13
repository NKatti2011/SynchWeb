define(['marionette', 'views/table', 'views/filter', 'modules/projects/views/addto', 'utils/table'], function(Marionette, TableView, FilterView, AddToProjectView, table) {

    
  var ClickableRow = table.ClickableRow.extend({
    event: 'samples:view',
    argument: 'BLSAMPLEID',
    cookie: true,
  })
    
  /*var ClickableRow = Backgrid.Row.extend({
    events: {
      'click': 'onClick',
    },
    onClick: function() {
      if ($(e.target).is('i') || $(e.target).is('a')) return
      app.cookie(this.model.get('PROP'))
      app.trigger('samples:view', this.model.get('BLSAMPLEID'))
    },
  })*/

  var StatusCell = Backgrid.Cell.extend({
    render: function() {
        this.$el.empty();
        
        var st = ''
        _.each(['R', 'SC', 'AI', 'DC', 'AP'], function(t) {
            if (this.model.get(t) > 0) st = '<li class="'+t+'"></li>'
        }, this)
        
        if (st) this.$el.append('<ul class="status">'+st+'</ul>')
        
        return this;
    }
  });
    
  return Marionette.LayoutView.extend({
    className: 'content',
    template: '<div><h1>Samples</h1><p class="help">This page shows sample associated with the currently selected proposal</p><div class="filter type"></div><div class="wrapper"></div></div>',
    regions: { wrap: '.wrapper', type: '.type' },
    
    initialize: function(options) {
      var columns = [
        //{ name: 'BLSAMPLEID', label: 'ID', cell: 'string', editable: false },
        { name: 'NAME', label: 'Name', cell: 'string', editable: false },
        { name: 'ACRONYM', label: 'Protein', cell: 'string', editable: false },
        { name: 'SPACEGROUP', label: 'Spacegroup', cell: 'string', editable: false },
        { name: 'COMMENTS', label: 'Comments', cell: 'string', editable: false },
        { name: 'SHIPMENT', label: 'Shipment', cell: 'string', editable: false },
        { name: 'DEWAR', label: 'Dewar', cell: 'string', editable: false },

        { name: 'CONTAINER', label: 'Container', cell: 'string', editable: false },
        { label: 'Snapshot', cell: table.TemplateCell, test: 'DCID', editable: false, template: '<img class="img" src="'+app.apiurl+'/image/id/<%=DCID%>" /> <img class="img" src="'+app.apiurl+'/image/id/<%=DCID%>/n/2" />' },
        { name: 'SC', label: 'SCs', cell: 'string', editable: false },
        { name: 'SCRESOLUTION', label: 'Res', cell: 'string', editable: false },
        { name: 'DC', label: 'DCs', cell: 'string', editable: false },
        { name: 'DCRESOLUTION', label: 'Res', cell: 'string', editable: false },
        { label: 'Status', cell: StatusCell, editable: false },
        { label: ' ', cell: table.ProjectCell, itemname: 'NAME', itemid: 'BLSAMPLEID', itemtype:'sample', editable: false },
      ]
        
      if (app.mobile()) {
        //_.each([0,3,4,5,6,7,9,11], function(v) {
        _.each([2,3,4,5,6,7,8,10], function(v) {
            columns[v].renderable = false
        })
      }
        
      var self = this
      this.table = new TableView({ collection: options.collection, columns: columns, tableClass: 'samples', filter: 's', loading: true, backgrid: { row: ClickableRow, emptyText: function() { return self.collection.fetched ? 'No samples found' : 'Retrieving samples' }  }, noPageUrl: options.noPageUrl, noSearchUrl: options.noSearchUrl })
        
      this.ty = new FilterView({
        url: !options.noFilterUrl,
        collection: options.collection,
        name: 't',
        filters: [
          { id: 'R', name: 'Robot Loaded'},
          { id: 'SC', name: 'Screened'},
          { id: 'AI', name: 'Auto Indexed'},
          { id: 'DC', name: 'Data Collected'},
          { id: 'AP', name: 'Auto Integrated'},
        ]  
      })
    },
                                      
    onRender: function() {
      this.wrap.show(this.table)
      this.type.show(this.ty)
    },
      
    onShow: function() {
      this.table.focusSearch()
    },
  })

})
