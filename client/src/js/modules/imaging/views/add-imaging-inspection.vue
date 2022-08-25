<template>
  <div class="content tw-p-3">
    <h1>Add New Container Inspection</h1>

    <div class="form">
      <validation-observer ref="addNewInspection" v-slot="{ invalid }" tag="form">
        <validation-provider v-slot="{ errors }" vid="inspectionTypeId" name="inspectiontype" rules="required" slim>
          <base-input-select
            outer-class="tw-mb-2 tw-py-2"
            v-model="INSPECTIONTYPEID"
            label="Inspection Type"
            description="Type of container inspection"
            name="INSPECTIONTYPEID"
            :options="inspectionTypes"
            optionValueKey="INSPECTIONTYPEID"
            optionTextKey="NAME"
            :error-class="errors[0] ? 'tw-text-xxs ferror' : ''"
            :error-message="errors[0]"
          />
        </validation-provider>

        <validation-provider v-slot="{ errors }" vid="temperature" name="temperature" rules="required|positive_decimal:1" slim>
          <base-input-text
            outer-class="tw-mb-2 tw-py-2"
            description="Temperature of the container"
            label="Temperature"
            type="number"
            step="0.1"
            name="TEMPERATURE"
            v-model="TEMPERATURE"
            :error-message="errors[0]"
            :error-class="errors[0] ? 'tw-text-xxs ferror' : ''"/>
        </validation-provider>

        <validation-provider v-slot="{ errors }" vid="timestamp" name="timestamp" rules="required|date_format:dd-MM-yyyy HH:mm" slim>
          <base-input-text
            id="dateTimePicker"
            outer-class="tw-mb-2 tw-py-2"
            description="Time / Date the inspection was conducted"
            label="Time / Date"
            name="BLTIMESTAMP"
            v-model="BLTIMESTAMP"
            :error-message="errors[0]"
            :error-class="errors[0] ? 'tw-text-xxs ferror' : ''"/>
        </validation-provider>

        <div class="">
          <button class="button tw-py-2" type="submit" @click="addNewContainerInspection">Add Container Inspection</button>
        </div>
      </validation-observer>
      <form class="form">


      </form>
    </div>
  </div>
</template>
<script>
import BaseInputSelect from 'app/components/base-input-select.vue'
import BaseInputText from 'app/components/base-input-text.vue'
import { ValidationProvider, ValidationObserver } from 'vee-validate'

import InspectionTypes from 'modules/imaging/collections/inspectiontypes'
import ContainerInspection from 'modules/imaging/models/inspection'

export default {
  name: 'add-imaging-inspection',
  components: {
    'validation-provider': ValidationProvider,
    'validation-observer': ValidationObserver,
    'base-input-text': BaseInputText,
    'base-input-select': BaseInputSelect
  },
  props: {
    containerId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      INSPECTIONTYPEID: '',
      TEMPERATURE: '',
      BLTIMESTAMP: '',
      inspectionTypes: []
    }
  },
  created() {
    this.fetchInspectionTypes()
  },
  mounted() {
    const self = this
    $('#dateTimePicker').datetimepicker({
      dateFormat: 'dd-mm-yy',
      onSelect: function(selected) {
        self.BLTIMESTAMP = selected
      }
    })
  },
  methods: {
    async fetchInspectionTypes() {
      const inspectionTypesCollection = new InspectionTypes()
      inspectionTypesCollection.state.pageSize = 9999

      const result = await this.$store.dispatch('getCollection', inspectionTypesCollection)
      this.inspectionTypes = result.toJSON()
      if (this.inspectionTypes.length > 0) {
        this.INSPECTIONTYPEID = this.inspectionTypes[0]['INSPECTIONTYPEID']
      }
    },
    async addNewContainerInspection(event) {
      event.preventDefault()
      const validForm = await this.$refs.addNewInspection.validate()
      if (validForm) {
        try {
          const containerInspectionModel = new ContainerInspection({
            BLTIMESTAMP: this.BLTIMESTAMP,
            TEMPERATURE: this.TEMPERATURE,
            INSPECTIONTYPEID: this.INSPECTIONTYPEID,
            CONTAINERID: this.containerId,
            MANUAL: 1
          })
          const result = await this.$store.dispatch('saveModel', containerInspectionModel)
          this.$store.commit('notifications/addNotification', {
            message: 'New container inspection created successfully',
            title: 'Container Inspection Created',
            level: 'success'
          })

          // Emit events for parent component to handle accordingly
          this.$emit('inspection-created')
          this.$emit('show-inspection', result.toJSON()['CONTAINERINSPECTIONID'])
        } catch (error) {
          this.$store.commit('notifications/addNotification', {
            message: 'Something went wrong registering container inspection, please try again',
            title: 'Error Creating Container Inspection',
            level: 'error'
          })
        }
      }
    }
  }
}
</script>