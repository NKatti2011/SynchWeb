define(['underscore', 'backbone', 'backbone.paginator', 'models/datacollection'], function(_, Backbone, PageableCollection, dc) {
  return PageableCollection.extend({
    model: dc,
    mode: 'server',
    url: '/dc',
                                      
    state: {
      pageSize: 15,
    },
                        
    initialize: function(models, options) {
      this.running = true
      if (options && options.running == false) this.running = false
      this.refresh_thread = null
      console.log('dc', options, this.running)

      this.fetched = false
      this.on('sync', this.setFetched, this)

      //if (options && options.queryParams) this.queryParams = $.extend({}, this.queryParams, options.queryParams || {})
    },

    setFetched: function() {
      if (this.fetched) return
        
      this.fetched = true
      this.trigger('reset')
    },
                                      
    stop: function() {
      clearTimeout(this.refresh_thread)
      this.running = false
    },
                                      
    parseState: function(r, q, state, options) {
      return { totalRecords: r[0]*state.pageSize }
    },
  
    parseRecords: function(r, options) {
      clearTimeout(this.refresh_thread)
      if (this.running) this.refresh_thread = setTimeout(this.fetch.bind(this), 5000)
      return r[1]
    },

  })
  
})