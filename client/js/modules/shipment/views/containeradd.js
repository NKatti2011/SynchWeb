define(['marionette',
    'views/form',
    'models/container',
    'models/protein',
    'models/sample',
    'collections/samples',
    'modules/shipment/views/puck',
    'modules/shipment/views/sampletable',
    
    'modules/shipment/models/cache',
    'modules/shipment/views/pastefrom',
    'modules/shipment/collections/distinctproteins',
    
    'modules/shipment/collections/platetypes',
    'modules/shipment/views/plate',
    'modules/shipment/views/singlesample',
    
    'tpl!templates/shipment/containeradd.html',
    'tpl!templates/shipment/sampletablenew.html',
    'tpl!templates/shipment/sampletablerownew.html'], function(Marionette,
        
    FormView,
    Container,
    Protein,
    Sample,
    Samples,
    PuckView,
    SampleTableView,
    Cache,
    PastFromView,
    DistinctProteins,
    PlateTypes,
    PlateView,
    SingleSample,
        
    template, table, row){
    
    // Use Location as idAttribute for this table
    var LocationSample = Sample.extend({
        idAttribute: 'LOCATION',
    })
        
        
    //return Marionette.LayoutView.extend({
    return FormView.extend({
        setupOnConstruct: false,
        className: 'content',
        template: template,
        regions: {
            table: '.table',
            puck: '.puck',
            single: '.singlesamp',
        },
        
        templateHelpers: function() {
            return {
                SHIPPINGID: this.dewar.get('SHIPPINGID'),
                SHIPMENT: this.dewar.get('SHIPPINGNAME'),
                DEWAR: this.dewar.get('CODE'),
            }
        },
        
        ui: {
            name: 'input[name=NAME]',
            type: 'select[name=CONTAINERTYPE]',
            pc: '.puck_controls',
            ext: '.extrainfo',
        },
        
        
        events: {
            'click .pf': 'pasteFrom',
        
            'change .samples input': 'cacheContainer',
            'keyup .samples input': 'cacheContainer',
            'blur .samples input': 'cacheContainer',
            'change .samples select': 'cacheContainer',
            'keyup .samples select': 'cacheContainer',
            'blur .samples select': 'cacheContainer',
        
            'click a.clonepuck': 'clonePuck',
            'click a.clearpuck': 'clearPuck',
            'click a.autofill': 'autoFill',
        
            'change @ui.type': 'setType',

            'click @ui.ext': 'toggleExtra',
        },


        toggleExtra: function (e) {
            e.preventDefault()
            //this.$el.find('.extra').toggleClass('show')
            this.table.currentView.toggleExtra()
        },


        setType: function(e) {
            this.type = this.ctypes.findWhere({ name: this.ui.type.val() })
            this.type.set({ isSelected: true })
            this.model.set({
                CAPACITY: this.type.get('capacity'),
                CONTAINERTYPE: this.type.get('name'),
            })
            
            if (this.type.get('name') == 'Puck') {
                this.buildCollection()
                this.puck.$el.css('width', '25%')
                this.puck.show(new PuckView({ collection: this.samples }))
                this.table.show(new SampleTableView({ proteins: this.proteins, collection: this.samples, childTemplate: row, template: table }))
                this.single.empty()
                this.ui.pc.show()

            } else {
                if (!app.mobile()) this.puck.$el.css('width', '50%')
                this.puck.show(new PlateView({ collection: this.samples, type: this.type, showValid: true }))
                this.table.empty()
                this.single.show(this.singlesample)
                this.ui.pc.hide()
                this.buildCollection()
            }
            console.log('samples', this.samples)
        },
        
        autoFill: function(e) {
            e.preventDefault()
            
            var acronym = this.getOption('visit')+'-p1'
            
            var p = this.proteins.findWhere({ ACRONYM: acronym })
            
            if (!p) {
                var p = new Protein({ ACRONYM: acronym })
                p.save({}, {
                    success: function() {
                        self.proteins.add(p)
                        self.$el.find('table.samples select[name=PROTEINID]').eq(0).combobox('value', p.get('PROTEINID')).trigger('change')
                        self.$el.find('table.samples input[name=NAME]').eq(0).val('x1').trigger('change')
                        self.clonePuck()
                    }
                })
            } else {            
                this.$el.find('table.samples select[name=PROTEINID]').eq(0).combobox('value', p.get('PROTEINID')).trigger('change')
                this.$el.find('table.samples input[name=NAME]').eq(0).val('x1').trigger('change')
                this.clonePuck()
            }
        },
        
        
        clearPuck: function(e) {
            if (e) e.preventDefault()
            this.ui.name.val('')
            this.$el.find('.clear').each(function(i,c) { $(c).trigger('click') })
        },
        
        clonePuck: function(e) {
            if (e) e.preventDefault()
            this.$el.find('.clone').each(function(i,c) { $(c).trigger('click') })
        },
        
        
        // Paste from old spreadsheet
        pasteFrom: function(e) {
            e.preventDefault()
            var pf = new PastFromView({ proteins: this.proteins })
            this.listenTo(pf, 'content:parsed', this.insertContent, this)
            app.dialog.show(pf)
        },
        
        insertContent: function(data) {
            this.samples.set(data.samples, { remove: false })
            this.table.currentView.render()
            this.ui.name.val(data.title)
        },
        

        // Cache container as user types
        cacheContainer: function() {
            console.log('caching')
            var hasData = false
            this.samples.each(function(s) {
                if (s.get('PROTEINID') > -1) hasData = true
                return
            })
            
            console.log('caching', hasData)
            if (!hasData) return
                
            var data = {
                samples: this.samples.toJSON(),
                title: this.ui.name.val(),
                time: new Date(),
            }
            
            this.cache.set({ data: data })
            this.cache.save({}, {
                success: function() {
                    app.alert({ message: 'Container contents last saved: '+new Date(), persist: 'saved', className: 'message notify', scrollTo: false })
                }
            })
        },
        
        loadContainerCache: function() {
            var samples = _.map(this.cache.get('data').samples, function(s) { return new LocationSample(s) })
            this.samples.set(samples, { remove: false })
            this.table.currentView.render()
            
            this.ui.name.val(this.cache.get('data').title)
            
            app.alert({ message: 'Container contents last saved: '+this.cache.get('data').time, persist: 'saved', className: 'message notify', scrollTo: false })
            console.log('loaded cache', this.cache)
        },
        
        
        // Callbacks for ajax requests
        success: function() {
            var self = this

            this.samples.each(function(s) {
                s.set({ CONTAINERID: this.model.get('CONTAINERID') }, { silent: true })
            }, this)

            var samples = new Samples(this.samples.filter(function(m) { return m.get('PROTEINID') > - 1 }))
            samples.save({
                success: function() {
                    app.alert({ message: 'New container &quot;'+self.model.get('NAME')+'&quot; created, Click <a href="/containers/cid/'+self.model.get('CONTAINERID')+'">here</a> to view it', persist: 'cadd'+self.model.get('CONTAINERID'), className: 'message notify' })
                    self.clearPuck()
                }

            })
        },
        
        error: function() {
            app.alert({ message: 'Something went wrong registering this container, please try again' })
        },
        
        
        createModel: function() {
            this.model = new Container({ DEWARID: this.dewar.get('DEWARID') })
        },
        
        
        selectSample: function() {
            if (this.type.get('name') != 'Puck') {
                var s = this.samples.findWhere({ isSelected: true })
                if (s) {
                    this.singlesample.setModel(s)
                    console.log('select sample', s)
                }
            }
        },
        
        initialize: function(options) {
            this.ready = []
            
            this.dewar = options.dewar
            this.samples = new Samples(null, { model: LocationSample })
            this.listenTo(this.samples, 'selected:change', this.selectSample)
            //this.buildCollection()
            this.setupValidation()
            
            this.proteins = new DistinctProteins()
            this.ready.push(this.proteins.fetch())
            
            this.cache = new Cache({ name: 'container' })
            this.ready2 = this.cache.fetch()
            this.ctypes = PlateTypes
            
            this.cacheContainer = _.debounce(this.cacheContainer, 3000)
            
        },

        buildCollection: function() {
            var samples = []
            _.each(_.range(1,this.type.get('capacity')+1), function(i) {
                samples.push(new LocationSample({ LOCATION: i.toString(), PROTEINID: -1, new: true }))
            }, this)
            this.samples.reset(samples)
            this.samples.at(0).set('isSelected', true)
        },

        
        onShow: function() {
            this.getOption('visit') ? this.$el.find('a.autofill').show() : this.$el.find('a.autofill').hide()
            $.when.apply($, this.ready).then(this.doOnShow.bind(this))
        },
        
        doOnShow: function() {
            console.log('show new puck')
            //this.puck.show(new PuckView({ collection: this.samples }))
            //this.table.show(new SampleTableView({ proteins: this.proteins, collection: this.samples, childTemplate: row, template: table }))
            this.ui.type.html(this.ctypes.opts())
            this.setType()
            this.singlesample = new SingleSample({ proteins: this.proteins, platetypes: this.ctypes, samples: this.samples })
            
            this.ready2.done(this.loadContainerCache.bind(this))
        }
    })

})