<template>
  <div class="content">
    <h1>Inspection Schedule</h1>
    <p class="help">This page lists all container inspections both completed and scheduled for the selected container.</p>

    <div class="tw-mt-8">
      <custom-table-component
        class="tw-w-full screen-component-group-table"
        :data-list="containerInspections"
        no-data-text="No components for this group">
        <template v-slot:tableHeaders>
          <td class="tw-w-32 tw-py-2 tw-text-center">Expected (hr)</td>
          <td class="tw-w-48 tw-py-2 tw-text-center">Scheduled</td>
          <td class="tw-w-32 tw-py-2 tw-text-center">Status</td>
          <td class="tw-w-24 tw-py-2 tw-text-center">Priority</td>
          <td class="tw-w-48 tw-py-2 tw-text-center">Processed</td>
          <td class="tw-w-32 tw-py-2 tw-text-center">Delta (d)</td>
          <td class="tw-w-48 tw-py-2 tw-text-center">Type</td>
          <td class="tw-w-24 tw-py-2 tw-text-center">Adhoc</td>
          <td class="tw-w-24 tw-py-2 tw-text-center">Manual</td>
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
              <td class="tw-w-32 tw-py-2 tw-text-center">{{ result['OFFSET_HOURS'] }}</td>
              <td class="tw-w-48 tw-py-2 tw-text-center">{{ result['SCHEDULEDTIMESTAMP'] }}</td>
              <td class="tw-w-32 tw-py-2 tw-text-center">{{ result['STATE'] }}</td>
              <td class="tw-w-24 tw-py-2 tw-text-center">{{ result['PRIORITY'] }}</td>
              <td class="tw-w-48 tw-py-2 tw-text-center">{{ result['BLTIMESTAMP'] }}</td>
              <td class="tw-w-32 tw-py-2 tw-text-center">{{ result['DELTA'] }}</td>
              <td class="tw-w-48 tw-py-2 tw-text-center">{{ result['INSPECTIONTYPE'] }}</td>
              <td class="tw-w-24 tw-py-2 tw-text-center">{{ result['SCHEDULECOMPONENTID'] ? 'No' : 'Yes' }}</td>
              <td class="tw-w-24 tw-py-2 tw-text-center">{{ Number(result['MANUAL']) === 1 ? 'Yes' : 'No' }}</td>
            </template>
          </custom-table-row>
        </template>
      </custom-table-component>
    </div>
  </div>
</template>
<script>
import CustomTableComponent from 'app/components/custom-table-component.vue'
import Inspections from 'modules/imaging/collections/inspections'
import CustomTableRow from 'app/components/custom-table-row.vue'

export default {
  name: 'container-schedule-component',
  components: {
    CustomTableRow,
    CustomTableComponent
  },
  props: {
    containerId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      containerInspections: [],
      headers: [
        { key: 'OFFSET_HOURS', title: 'Expected (hr)' },
        { key: 'SCHEDULEDTIMESTAMP', title: 'Scheduled' },
        { key: 'STATE', title: 'Status' },
        { key: 'PRIORITY', title: 'Priority' },
        { key: 'BLTIMESTAMP', title: 'Processed' },
        { key: 'DELTA', title: 'Delta (d)' },
        { key: 'INSPECTIONTYPE', title: 'Type' }
      ]
    }
  },
  created() {
    this.fetchContainerInspectionData()
  },
  methods: {
    async fetchContainerInspectionData() {
      const containerInspectionCollection = new Inspections()
      containerInspectionCollection.queryParams.cid = this.containerId
      containerInspectionCollection.queryParams.allStates = 1

      const result = await this.$store.dispatch('getCollection', containerInspectionCollection)
      this.containerInspections = result.toJSON()
    }
  }
}
</script>