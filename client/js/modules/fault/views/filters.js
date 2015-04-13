define(['marionette',
    'modules/fault/collections/bls',
    'modules/fault/collections/systems',
    'modules/fault/collections/components',
    'modules/fault/collections/subcomponents',
    'tpl!templates/fault/filters.html',
    ], function(Marionette, Beamlines, Systems, Components, SubComponents, filtertemplate) {
    
    return FilterView = Marionette.ItemView.extend({
        template: filtertemplate,
        className: 'filter filter-nohide',
        
        ui: {
            bl: 'select[name=BEAMLINE]',
            system: 'select[name=SYSTEMID]',
            component: 'select[name=COMPONENTID]',
            subcomponent: 'select[name=SUBCOMPONENTID]',
        },
        
        events: {
            'change @ui.bl': 'updateSystems',
            'change @ui.system': 'updateComponents',
            'change @ui.component': 'updateSubComponents',
            'change @ui.subcomponent': 'refetch',
            'click a.clear': 'clearFilters',
        },

        clearFilters: function(e) {
            e.preventDefault()
            
            this.ui.bl.val('')
            this.ui.system.val('')
            this.ui.component.val('')
            this.ui.subcomponent.val('')
            
            this.collection.fetch()
            this.updateSystems()
        },
        
        initialize: function() {
            var self = this
            this.collection.queryParams.bl = function() {
                return self.ui.bl.val()
            }
            this.collection.queryParams.sid = function() {
                if (self.ui.system.val() > 0) return self.ui.system.val()
            }
            this.collection.queryParams.cid = function() {
                if (self.ui.component.val() > 0) return self.ui.component.val()
            }
            this.collection.queryParams.scid = function() {
                if (self.ui.subcomponent.val() > 0) return self.ui.subcomponent.val()
            }
        },
        
        refetch: function() {
            this.collection.fetch()
        },
        
        onRender: function() {
            var self = this
            
            this.beamlines = new Beamlines()
            this.beamlines.fetch().done(function() {
                self.ui.bl.html('<option value="">-</option><option value="P01">Phase I</option>'+self.beamlines.opts())
                self.updateSystems()
            })
            
            this.systems = new Systems(null, {
                queryParams: {
                    bl: function() {
                        console.log('getting bl in sys', self.ui.bl.val())
                        return self.ui.bl.val()
                    }
                }
            })
            
            this.components = new Components(null, {
                queryParams: {
                    bl: function() {
                        return self.ui.bl.val()
                    },
                    sid: function() {
                        return self.ui.system.val()
                    }
                }
            })
            
            this.subcomponents = new SubComponents(null, {
                queryParams: {
                    bl: function() {
                        return self.ui.bl.val()
                    },
                    cid: function() {
                        return self.ui.component.val()
                    }
                }
            })
        },
        
        
        updateSystems: function(e) {
            this.systems.fetch().done(this.doUpdateSystems.bind(this,e))
        },
        doUpdateSystems: function(e) {
            var val = this.ui.system.val()
            this.ui.system.html('<option value="0">-</option>'+this.systems.opts()).val(val)
            if (e) this.collection.fetch()            
            this.updateComponents()
        },

        
        updateComponents: function(e) {
            this.components.fetch().done(this.doUpdateComponents.bind(this,e))
        },
        doUpdateComponents: function(e) {
            var val = this.ui.component.val()
            this.ui.component.html('<option value="0">-</option>'+this.components.opts()).val(val)
            this.updateSubComponents()
            if (e) this.collection.fetch()
        },
        updateSubComponents: function(e) {
            this.subcomponents.fetch().done(this.doUpdateSubComponents.bind(this,e))
        },
        doUpdateSubComponents: function(e) {
            var val = this.ui.subcomponent.val()
            this.ui.subcomponent.html('<option value="0">-</option>'+this.subcomponents.opts()).val(val)
            if (e) this.collection.fetch()
        },
      
    })

})