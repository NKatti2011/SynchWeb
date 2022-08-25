<template>
  <div class="tw-w-full content">
    <h1>Container: {{ container.NAME }}</h1>

    <p class="help">This page shows the contents of the selected container. Samples can be added and edited by clicking the pencil icon, and removed by clicking the x</p>

    <p v-if="container['CONTAINERSTATUS'] === 'processing'" class="message alert">This container is currently assigned and in use on a beamline sample changer. Unassign it to make it editable</p>

    <div class="tw-w-full tw-flex">
      <div class="tw-w-2/5">
        <div v-if="Number(container['INSPECTIONS']) > 0" class="inspection form">
          <div class="plate tw-mb-4"></div>
          <div class="statuses tw-mb-8">
            <div class="tw-flex tw-mb-2 tw-items-center tw-justify-end">
              <span class="tw-mr-2">Show Data Status</span>
              <base-input-checkbox v-model="showDataStatus" class="tw-mr-4"/>
              <span class="tw-mr-2">Rank By</span>
              <base-input-checkbox v-model="rankByStatus"/>
              <span>&colon;</span>
              <base-input-select option-text-key="name" option-value-key="value" :options="rankByOptions" v-model="rankByValue" class="tw-ml-2" />
            </div>

            <div class="tw-flex tw-mb-4 tw-items-center tw-justify-end">
              <span class="tw-mr-2">Show Auto Scores</span>
              <base-input-checkbox v-model="showAutoScores" class="tw-mr-4"/>
              <base-input-select option-text-key="SCHEMANAME" option-value-key="BLSAMPLEIMAGEAUTOSCORESCHEMAID" :options="autoScoresSchemas" v-model="selectedAutoScoreSchema"  class="tw-mr-4"/>
              <span class="tw-mr-2">Class:</span>
              <base-input-select option-text-key="NAME" option-value-key="VALUE" :options="autoScoresClass" v-model="selectedAutoScoreClass" />
            </div>

            <div class="sta small"></div>
          </div>

          <div class="tw-mb-8">
            <div class="tw-mb-4 tw-flex tw-w-full tw-items-center">
              <span class="label">Inspections</span>
              <base-input-select class="tw-mr-2" option-text-key="TITLE" option-value-key="CONTAINERINSPECTIONID" :options="containerInspections" v-model="selectedContainerInspection" />
              <button class="button tw-h-6" @click="addInspection"><span class="tw-mr-2"><i class="fa fa-plus"></i></span> Add</button>
            </div>

            <div class="tw-flex tw-w-full tw-items-center">
              <span class="label">Movie</span>
              <span class="tw-mr-1">Gap:</span>
              <base-input-text v-model="movieGap" type="number" step="0.1" input-class="tw-m-0"/>
              <span>s</span>
              <button class="button tw-mx-2" @click="playSampleImageMovie"><span class="tw-mr-4"><i class="fa fa-play"></i> </span>Play</button>
            </div>
          </div>
        </div>

        <div class="form">
          <div class="tw-mb-8 tw-w-full">
            <span class="label">Shipment</span>
            <span><router-link :to="`/shipments/sid/${container.SHIPPINGID}`">{{ container.SHIPMENT }}</router-link></span>
          </div>

          <div class="tw-mb-8 tw-w-full">
            <span class="label tw-w-3/5">Dewar</span>
            <span>{{container.DEWAR}}</span>
          </div>

          <div class="tw-mb-8 tw-w-full">
            <span class="label">Container Type</span>
            <span>{{container.CONTAINERTYPE}}</span>
          </div>

          <div class="tw-mb-8 tw-w-full tw-flex">
            <span class="label">Owner</span>
            <base-input-select
              v-model="container.OWNERID"
              :options="users"
              optionValueKey="PERSONID"
              :inline="true"
              @save="save('OWNERID')"
              optionTextKey="FULLNAME"/>
          </div>

          <div class="tw-mb-8 tw-w-full tw-flex">
            <span class="label">Barcode</span>
            <base-input-text
              v-model="container.BARCODE"
              :inline="true"
              initialText="Click to edit"
              @save="save('BARCODE')"/>
          </div>

          <div class="tw-mb-8 tw-w-full tw-flex">
            <span class="label">Comments</span>
            <base-input-text v-model="container.COMMENTS" :inline="true" @save="save('COMMENTS')" initial-text="Click to edit " inlineText="Click to edit"/>
          </div>

          <div class="tw-mb-8 tw-w-full" v-if="container.REQUESTEDIMAGERID">
            <span class="label">Requested Imager Location</span>
            <span class="IMAGERID">{{ container.REQUESTEDIMAGER }}</span>
          </div>

          <div class="tw-mb-8 tw-w-full" v-if="container.IMAGERID">
            <span class="label">Current Imager Location</span>
            <span>{{ container.IMAGER }}</span>
          </div>

          <div class="tw-mb-8 tw-w-full" v-if="container.SCHEDULEID">
            <span class="label">Imaging Schedule</span>
            <span>
              <span class="mr-3">{{ container.SCHEDULE }} </span>
              <button class="button tw-text-content-page-color" @click="viewContainerSchedule"><span class="mr-1"><i class="fa fa-search"></i></span> View</button></span>
          </div>

          <div class="tw-mb-8 tw-w-full" v-if="container.SCREENID">
            <span class="label">Crystallisation Screen</span>
            <span>
              <span class="mr-3">{{ container.SCREEN }} </span>
              <router-link :to="`/imaging/screen/${container.SCREENID}`" class="button" @click="viewContainerSchedule"><span class="mr-1"><i class="fa fa-search"></i></span> View</router-link></span>
          </div>

          <div class="tw-mb-8 tw-w-full">
            <span class="label">Last Inspection</span>
            <span v-if="Number(container.INSPECTIONS) > 0" >{{ container.LASTINSPECTION }} ({{ container.INSPECTIONS }} inspections)</span>
            <span v-else><button class="button" @click="addInspection"><span class="tw-mr-2"><i class="fa fa-plus"></i></span>Add Manual Inspection</button></span>
          </div>

          <div class="tw-mb-8 tw-w-full" v-if="container.VISIT">
            <span class="label">Data Collections</span>
            <span>
              <router-link :to="`/dc/visit/${container.VISIT}`" class="button"><span class="tw-mr-2"><i class="fa fa-search"></i></span>View</router-link>
            </span>
          </div>

          <div class="tw-mb-8 tw-flex tw-w-full" v-if="container.IMAGERID">
            <span class="label">Actions</span>
            <div>
              <div class="tw-mb-2">
                <div v-if="container['CONTAINERQUEUEID']">
                  This container was queued for data collection at {{ container['QUEUEDTIMESTAMP'] }}
                  <router-link :to="`/containers/queue/${containerId}`"><span><i class="fa fa-list"></i> <span>View Sample Queue</span></span></router-link>
                </div>
                <div v-else>
                  <router-link :to="`/containers/queue/${containerId}`" class="button tw-flex data-collection-button tw-items-center">
                    <span class="tw-mr-3"><i class="fa-3x fa fa-list"></i></span>
                    <span class="button-text">Prepare for Data Collection</span>
                  </router-link>
                </div>
              </div>

              <div class="tw-mb-2 adhoc tw-flex tw-items-center">
                <base-input-select
                  v-if="Number(container['ALLOW_ADHOC']) === 1"
                  option-text-key="NAME"
                  option-value-key="INSPECTIONTYPEID"
                  :options="inspectionTypes" v-model="selectedInspectionTypeId" />
                <button v-if="Number(container['ALLOW_ADHOC']) === 1" class="button tw-text-content-page-color tw-ml-2" @click="requestAdhoc">
                  <span><i class="fa fa-picture-o"></i> </span> Request Plate Imaging
                </button>
                <p v-else>An adhoc inspection of this container has been requested</p>
              </div>

              <div class="tw-mb-2">
                <p v-if="container['REQUESTEDRETURN'] === 1">This plate has been requested for return to the user</p>
                <button v-else class="button tw-text-content-page-color" @click="triggerPlateReturn"><span><i class="fa fa-paper-plane-o"></i> </span> Request Return</button>
              </div>
            </div>
          </div>

          <div class="tw-mb-8 tw-flex tw-w-full">
            <span class="label">Location History</span>
            <div class="history">
              <custom-table-component :data-list="containerHistory" >
                <template v-slot:tableHeaders>
                  <td class="tw-w-24 tw-py-2 tw-text-center">Date</td>
                  <td class="tw-w-24 tw-py-2 tw-text-center">Status</td>
                  <td class="tw-w-24 tw-py-2 tw-text-center">Location</td>
                  <td class="tw-w-24 tw-py-2 tw-text-center">Beamline</td>
                </template>
                <template v-slot:slotData="{ dataList }">
                  <custom-table-row
                    class="tw-w-full"
                    :class="[rowIndex % 2 === 0 ? 'tw-bg-table-body-background' : 'tw-bg-table-body-background-odd']"
                    v-for="(result, rowIndex) in dataList"
                    :key="rowIndex"
                    :result="result"
                    :row-index="rowIndex">
                    <template v-slot:default="{ result, rowIndex }">
                      <td class="tw-w-24 tw-py-2 tw-text-center">{{ result['BLTIMESTAMP'] }}</td>
                      <td class="tw-w-24 tw-py-2 tw-text-center">{{ result['STATUS'] }}</td>
                      <td class="tw-w-24 tw-py-2 tw-text-center">{{ result['LOCATION']}}</td>
                      <td class="tw-w-24 tw-py-2 tw-text-center">{{ result['BEAMLINENAME'] }}</td>
                    </template>
                  </custom-table-row>
                </template>
                <template v-slot:noData>
                  <tr class="tw-w-full tw-bg-table-body-background-odd">
                    <td colspan="4" class="tw-text-center tw-py-2">No history at this time</td>
                  </tr>
                </template>
              </custom-table-component>
              <pagination-component
                v-if="containerHistoryCollection"
                :total-records="containerHistoryCollection.state.totalRecords"
                :initial-page="1"
                :page-links="3"
                @page-changed="onUpdateHistory" />
            </div>
          </div>
        </div>

        <div v-if="container['INSPECTIONS'] < 1" class="tw-w-full">
          <div class="singlesample"></div>
          <div class="group"></div>
        </div>
      </div>

      <div class="tw-w-3/5"></div>
    </div>

    <custom-dialog-box
      v-if="displayCustomDialogBox"
      size="large"
      :hide-ok-button="true"
      @perform-modal-action="performModalAction"
      @close-modal-action="closeModalAction">
      <template>
        <div class="tw-bg-modal-header-background tw-py-1 tw-pl-4 tw-pr-2 tw-rounded-sm tw-flex tw-w-full tw-justify-between tw-items-center tw-relative tw-border tw-border-content-border">
          <p class="tw-font-bold tw-text-content-page-color">{{ displayedModalTitle }}</p>
          <button
              class="tw-flex tw-items-center tw-border tw-rounded-sm tw-border-content-border tw-bg-white tw-text-content-page-color tw-p-1"
              @click="closeModalAction">
            <i class="fa fa-times"></i>
          </button>
        </div>
        <container-schedule-component v-if="displayedModal === 'containerSchedule'" :container-id="containerId" class="tw-mt-4" />
        <add-imaging-inspection v-if="displayedModal === 'addInspection'" :container-id="containerId" />
      </template>
    </custom-dialog-box>
  </div>
</template>
<script>
import { mapGetters } from 'vuex'

import BaseInputSelect from 'app/components/base-input-select.vue'
import BaseInputText from 'js/app/components/base-input-text.vue'
import BaseInputCheckbox from 'app/components/base-input-checkbox.vue'
import CustomDialogBox from 'app/components/custom-dialog-box.vue'
import ContainerScheduleComponent from 'modules/imaging/views/container-schedule-component.vue'
import CustomTableComponent from 'app/components/custom-table-component.vue'
import CustomTableRow from 'app/components/custom-table-row.vue'
import Pagination from 'app/components/pagination.vue'
import AddImagingInspection from 'modules/imaging/views/add-imaging-inspection.vue'

import Samples from 'collections/samples'
import Users from 'collections/users'
import ContainerHistory from 'modules/shipment/collections/containerhistory'
import ContainerInspections from 'modules/imaging/collections/inspections'
import ScreenComponentGroups from 'modules/imaging/collections/screencomponentgroups'
import ScreenComponents from 'modules/imaging/collections/screencomponents'
import InspectionTypes from 'modules/imaging/collections/inspectiontypes'
import DataCollections from 'collections/datacollections'
import SubSamples from 'collections/subsamples'
import DistinctProteins from 'modules/shipment/collections/distinctproteins'
import AutoScores from 'modules/imaging/collections/autoscores'
import AutoScoreSchemas from 'modules/imaging/collections/autoscoreschemas'

export default {
  name: 'container-plate-view',
  props: {
    options: {
      type: Object,
      default: () => ({}),
      required: true
    }
  },
  components: {
    'add-imaging-inspection': AddImagingInspection,
    'pagination-component': Pagination,
    'custom-table-row': CustomTableRow,
    'custom-table-component': CustomTableComponent,
    'container-schedule-component': ContainerScheduleComponent,
    'custom-dialog-box': CustomDialogBox,
    'base-input-checkbox': BaseInputCheckbox,
    'base-input-select': BaseInputSelect,
    'base-input-text': BaseInputText
  },
  data() {
    return {
      // Container Information
      container: {},
      containerHistoryCollection: new ContainerHistory(),
      containerHistory: [],
      containerInspections: [],
      selectedContainerInspection: '',
      screenComponentGroups: [],
      screenComponents: [],
      inspectionTypes: [],
      selectedInspectionTypeId: '',

      users: [],
      inspections: '',
      showDataStatus: false,
      rankByStatus: false,
      rankByOptions: [
        {
          name: 'AP Resolution',
          value: 'DCRESOLUTION',
          check: 'DC',
          inverted: 1
        },
        {
          name: 'AP Completeness',
          value: 'DCCOMPLETENESS',
          check: 'DC',
          min: 0.85
        }
      ],
      rankByValue: 'DCRESOLUTION',
      showAutoScores: false,
      autoScoresSchemas: [],
      autoScoresClass: [],
      autoScoreClassList: [],
      selectedAutoScoresClass: '',
      selectedAutoScoreSchema: '',
      selectedAutoScoreClass: '',

      // Samples
      samplesCollection: null,
      samples: [],
      selectedSample: null,
      selectedSampleDataCollection: [],
      autoScores: [],

      // Sub Samples
      subSampleCollections: null,
      subSamples: [],

      // Container Sample Movies
      movieGap: 0.5,
      isPlaying: false,
      cacheThread: null,
      playThread: null,
      caching: true, // Not sure what this does

      // Proteins
      proteins: [],
      gProteinsCollection: new DistinctProteins(),

      // PlateView Params
      rankStatusOption: null,
      showSampleStatus: false,

      // Others
      displayCustomDialogBox: false,
      displayedModal: '',
      displayedModalTitle: ''
    }
  },
  created() {
    this.loadContainerViewPage()
  },
  methods: {
    async loadContainerViewPage() {
      await this.fetchContainerDetails()
      await this.fetchContainerSamples()
      this.fetchUsersForProposal()
      this.fetchContainerHistory()
      this.fetchContainerInspections()
      this.fetchProteinCollections()

      if (this.container['SCREENID']) {
        this.fetchScreenComponentGroups()
        this.fetchScreenComponents()
      }

      if (Number(this.container['INSPECTIONS']) > 0) {
        this.fetchInspectionTypes()
      }
    },
    async fetchContainerDetails() {
      const result = await this.$store.dispatch('getModel', this.model)
      this.container = result.toJSON()
    },
    async fetchContainerSamples() {
      this.samplesCollection = new Samples(null, { state: { pageSize: 9999 } })
      this.samplesCollection.queryParams.cid = this.containerId
      // TODO: Handle sample Selecttion

      const result = await this.$store.dispatch('getCollection', this.samplesCollection)

      this.samples = result.toJSON()
    },
    async fetchUsersForProposal() {
      const usersCollection = new Users(null, { state: { pageSize: 9999 }})
      usersCollection.queryParams.all = 1
      // Assumption all plates are for vmxi, so login => users only
      usersCollection.queryParams.login = 1
      usersCollection.queryParams.pid = this.proposalId

      const result = await this.$store.dispatch('getCollection', usersCollection)
      this.users = result.toJSON()
    },
    async fetchContainerHistory() {
      this.containerHistoryCollection.queryParams.cid = this.containerId
      const result = await this.$store.dispatch('getCollection', this.containerHistoryCollection)

      this.containerHistory = result.toJSON()
    },
    async fetchContainerInspections() {
      const containerInspectionsCollection = new ContainerInspections()
      containerInspectionsCollection.queryParams.cid = this.containerId
      containerInspectionsCollection.queryParams.delta = 1
      containerInspectionsCollection.setSorting('BLTIMESTAMP', 1)

      const result = await this.$store.dispatch('getCollection', containerInspectionsCollection)
      this.containerInspections = result.toJSON()
      if (this.containerInspections.length > 0) {
        this.selectedContainerInspection = this.containerInspections[0]['CONTAINERINSPECTIONID']
      }
    },
    async fetchScreenComponentGroups() {
      const screenComponentGroupsCollections = new ScreenComponentGroups(null, { state: { pageSize: 9999 } })
      screenComponentGroupsCollections.queryParams.scid = this.container['SCREENID']

      const result = await this.$store.dispatch('getCollection', screenComponentGroupsCollections)
      this.screenComponentGroups = result.toJSON()
    },
    async fetchScreenComponents() {
      const screenComponentsCollections = new ScreenComponents(null, { state: { pageSize: 9999 } })
      screenComponentsCollections.queryParams.scid = this.container['SCREENID']

      const result = await this.$store.dispatch('getCollection', screenComponentsCollections)
      this.screenComponents = result.toJSON()
    },
    async fetchInspectionTypes() {
      const inspectionTypesCollection = new InspectionTypes()

      const result = await this.$store.dispatch('getCollection', inspectionTypesCollection)
      this.inspectionTypes = result.toJSON()
      if (this.inspectionTypes.length > 0) {
        this.selectedInspectionTypeId = this.inspectionTypes[0]['INSPECTIONTYPEID']
      }
    },
    async fetchSubSamples() {
      this.subSampleCollections = new SubSamples()
      this.subSampleCollections.sid = this.selectedSample['BLSAMPLEID']
      // TODO: handle Saving sub sample comments and reloading

      const result = await this.$store.dispatch('getCollection', this.subSampleCollections)
      this.subSamples = result.toJSON()
    },
    async fetchSampleDataCollection() {
      const sampleDataCollection = new DataCollections(null, { running: false, state: { pageSize: 9999 } })
      sampleDataCollection.queryParams.sid = this.selectedSample['BLSAMPLEID']

      const result = await this.$store.dispatch('getCollection', sampleDataCollection)
      this.selectedSampleDataCollection = result.toJSON()
    },
    async fetchProteinCollections() {
      const proteinsCollection = new DistinctProteins()

      const result = await this.$store.dispatch('getCollection', proteinsCollection)
      this.proteins = result.toJSON()
    },
    async fetchAutoScoresSchema() {
      const autoScoresSchemasCollection = new AutoScoreSchemas()
      autoScoresSchemasCollection.queryParams.CONTAINERINSPECTIONID = this.selectedContainerInspection

      const result = await this.$store.dispatch('getCollection', autoScoresSchemasCollection)
      this.autoScoresSchemas = result.toJSON()
      if (this.autoScoresSchemas.length > 0) {
        this.selectedAutoScoreSchema = this.autoScoresSchemas[0]['BLSAMPLEIMAGEAUTOSCORESCHEMAID']
      }
    },
    async fetchAutoScores() {
      const autoScoresCollection = new AutoScores()
      autoScoresCollection.queryParams.CONTAINERINSPECTIONID = this.selectedContainerInspection
      autoScoresCollection.queryParams.BLSAMPLEIMAGEAUTOSCORESCHEMAID = this.selectedAutoScoreSchema

      const result = await this.$store.dispatch('getCollection', autoScoresCollection)
      this.autoScores = result.toJSON()

      if (this.autoScores.length > 0) {
        this.autoScoreClassList = this.autoScores[0]['CLASSES']
        this.autoScoresClass = Object.keys(this.autoScoreClassList).map(classItem => ({ NAME: classItem, VALUE: classItem }))
        this.selectedAutoScoreClass = this.autoScoresClass[0]['VALUE']
      }
    },
    save(field) {},
    viewContainerSchedule() {
      this.displayedModal = 'containerSchedule'
      this.displayedModalTitle = 'View Inspection Schedule'
      this.displayCustomDialogBox = true
    },
    addInspection() {
      this.displayedModal = 'addInspection'
      this.displayedModalTitle = 'Add Manual Container Inspection'
      this.displayCustomDialogBox = true
    },
    playSampleImageMovie() {},
    handleInspectionChange(value) {
      if (value) {
        this.fetchAutoScoresSchema()
      }
    },
    handleAutoScoreSchemaChange(value) {
      if (value) {
        this.fetchAutoScores()
      }
    },
    setRankStatus() {
      if (this.rankByStatus) {
        const selectedRankByOptions = this.rankByOptions.find(rank => rank['VALUE'] === this.rankByValue)
        this.rankStatusOption = selectedRankByOptions ? selectedRankByOptions : null
      }

      if (this.rankByStatus && !this.showDataStatus) {
        this.showDataStatus = true
        this.toggleSampleStatus()
      }
    },
    toggleSampleStatus() {
      this.showAutoScores = false
    },
    setAutoStatus() {
      this.showDataStatus = false
      this.rankByStatus = false

      // TODO: handle show sample status
      // TODO: handle plate view set auto status (this.showAutoScores && this.selectedAutoScoreClass)
    },
    performModalAction() {},
    closeModalAction() {
      this.displayCustomDialogBox = false
      this.displayedModal = ''
      this.displayedModalTitle = ''
    },
    triggerPlateReturn() {
      this.model.set({ REQUESTEDRETURN: 1 })
      this.$store.dispatch('saveModel', { model: this.model, attributes: { REQUESTEDRETURN: '1' } })

      this.$store.commit('notifications/addNotification', {
        message: 'Return of this container to the user has been successfully requested',
        level: 'success',
        title: 'Return Container'
      })

      this.fetchContainerDetails()
    },
    async requestAdhoc() {
      await this.$store.dispatch('fetchDataFromApi', {
        requestType: 'requesting an adhoc inspection for this container',
        url: '/imaging/inspection/adhoc',
        data: {
          cid: this.containerId,
          INSPECTIONTYPEID: this.selectedInspectionTypeId
        }
      })

      this.$store.commit('notifications/addNotification', {
        message: 'Adhoc inspection successfully requested for this container',
        level: 'success',
        title: 'Adhoc Inspection'
      })

      this.fetchContainerDetails()
    },
    onUpdateHistory(payload) {
      this.containerHistoryCollection.setPageSize(payload.pageSize)
      this.containerHistoryCollection.getPage(payload.currentPage)

      this.fetchContainerHistory()
    },
  },
  computed: {
    ...mapGetters({}),
    proposalId() {
      return this.$store.getters['proposal/getProposalModelField']('PROPOSALID')
    },
    model() {
      return this.options.model
    },
    containerId() {
      return this.model.get('CONTAINERID')
    }
  },
  watch: {
    selectedContainerInspection: {
      handler: 'handleInspectionChange',
      immediate: true
    },
    selectedAutoScoreSchema: {
      handler: 'handleAutoScoreSchemaChange',
      immediate: true
    },
    rankByStatus: {
      handler: 'setRankStatus',
      immediate: true
    },
    rankByValue: {
      handler: 'setRankStatus',
      immediate: true
    },
    showAutoScores: {
      handler: 'setAutoStatus',
      immediate: true
    },
    showDataStatus: {
      handler: 'toggleSampleStatus',
      immediate: true
    }
  }
}
</script>
<style scoped>
div.form.inspection >>> select,
div.form.inspection >>> input,
div.form .adhoc >>> select {
  margin: 0;
}

.data-collection-button.button .button-text {
  @apply tw-text-xl;
}

div .form span.label {
  @apply tw-w-56;
}
</style>