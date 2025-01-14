<?php

namespace SynchWeb\Page\EM;

use SynchWeb\Page\EM\DataCollectionSchema;
use SynchWeb\Page\EM\SchemaValidator;

trait DataCollection
{
    public function dataCollectionSchema()
    {
        $schema = new DataCollectionSchema();
        $this->_output($schema->clientSchema());
    }

    /**
     * This is a "long term temporary workaround" for creating Data Collections
     * via the Synchweb UI.
     */
    public function dataCollectionCreate()
    {
        global $visit_directory;

        $schema = new DataCollectionSchema();
        $validator = new SchemaValidator($schema);

        list($invalid, $postData) = $validator->validatePostData(
            json_decode($this->app->request->getBody(), true)
        );
        if (count($invalid) > 0) {
            $this->_error($invalid, 400);
        }

        $session = $this->sessionFetch($this->arg('session'));

        $this->sessionExitIfNotActive($session);

        $imageDirectory = $this->sessionSubstituteValuesInPath(
            $session,
            $visit_directory
        ) . '/' . $postData['imageDirectory'] . '/';

        $fileTemplate = (
            $postData['acquisitionSoftware'] == 'EPU' ?
                'GridSquare_*/Data/*.' : 'Frames/*.'
        ) . $postData['imageSuffix'];

        if (count(glob($imageDirectory . $fileTemplate, GLOB_NOSORT)) == 0) {
            $this->dataCollectionFileError("Raw files don't exist");
        }

        $existingCollection = $this->dataCollectionFindExisting(
            $session['sessionId'],
            $imageDirectory,
            $fileTemplate
        );

        if ($existingCollection !== null) {
            $this->dataCollectionFileError("Data Collection already exists");
        }

        $dataCollectionId = null;

        try {
            $this->db->start_transaction();

            $this->db->pq(
                "INSERT INTO DataCollectionGroup (
                    sessionId, comments, experimentType
                )
                VALUES (:1, :2, :3)
                RETURNING dataCollectionGroupId INTO :id",
                array($session['sessionId'], 'Created by SynchWeb', 'EM')
            );

            $inserts = $schema->inserts(
                $postData,
                array(
                    'sessionId' => $session['sessionId'],
                    'dataCollectionGroupId' => $this->db->id(),
                    'endTime' => $session['endDate'],
                    'runStatus' => 'Created by SynchWeb',
                    'imageDirectory' => $imageDirectory,
                    'fileTemplate' => $fileTemplate,
                )
            );

            $this->db->pq(
                "INSERT INTO DataCollection ({$inserts['fieldNames']})
                    VALUES ({$inserts['placeholders']})
                    RETURNING dataCollectionId INTO :id",
                $inserts['values']
            );
            $dataCollectionId = $this->db->id();

            $this->db->end_transaction();
        } catch (Exception $e) {
            error_log("Failed to add DataCollection to database.");
            $this->_error("Failed to add DataCollection to database.", 500);
        }

        $this->_output(array('id' => $dataCollectionId));
    }

    /**
     * Fetch the applicable (to EM) fields from the DataCollection
     *
     * Once the transfer script is available at eBIC, SynchWeb will no longer
     * be required to create DataCollections and the use of dataCollectionSchema
     * will be largely irrelevant and it may be worthwhile to just use an
     * "ordinary" query here.
     */
    public function dataCollectionGet()
    {
        $schema = new DataCollectionSchema();
        $selections = implode(', ', $schema->selections());
        $rows = $this->db->pq(
            "SELECT
                $selections
                FROM DataCollection
                LEFT JOIN DataCollectionFileAttachment
                    ON DataCollectionFileAttachment.dataCollectionId = DataCollection.dataCollectionId
                LEFT JOIN DataCollectionComment
                    ON DataCollectionComment.dataCollectionId = DataCollection.dataCollectionId
                INNER JOIN DataCollectionGroup
                    ON DataCollectionGroup.dataCollectionGroupId = DataCollection.dataCollectionGroupId
                INNER JOIN BLSession
                    ON BLSession.sessionId = DataCollectionGroup.sessionId
                INNER JOIN Proposal
                    ON Proposal.proposalId = BLSession.proposalId
                WHERE CONCAT(Proposal.proposalCode, Proposal.proposalNumber) = :1
                AND DataCollection.dataCollectionId = :2",
            array(
                $this->arg('prop'),
                $this->arg('id')
            ),
            false
        );

        if (sizeof($rows) == 0) {
            $this->_error('No data collection');
        }

        $this->_output($schema->processRow($rows[0]));
    }

    public function dataCollectionComments()
    {
        $rows = $this->db->pq(
            "SELECT
                DataCollection.comments
                FROM DataCollection
                INNER JOIN DataCollectionGroup
                    ON DataCollectionGroup.dataCollectionGroupId = DataCollection.dataCollectionGroupId
                INNER JOIN BLSession
                    ON BLSession.sessionId = DataCollectionGroup.sessionId
                INNER JOIN Proposal
                    ON Proposal.proposalId = BLSession.proposalId
                WHERE CONCAT(Proposal.proposalCode, Proposal.proposalNumber) = :1
                AND DataCollection.dataCollectionId = :2",
            array(
                $this->arg('prop'),
                $this->arg('id')
            ),
            false
        );
        if (sizeof($rows) == 0) {
            $this->_error('No data collection');
        }

        $this->db->pq(
            "UPDATE DataCollection SET comments=:1 WHERE DataCollection.dataCollectionId = :2",
            array(
                json_decode($this->app->request->getBody(), true)['comments'],
                $this->arg('id')
            )
        );
        $this->_output(array('updated' => $this->arg('id')));
    }

    ////////////////////////////////////////////////////////////////////////////

    /**
     * Returns an error message against all fields that make up imageTemplate
     *
     * @param string $message
     */
    private function dataCollectionFileError($message)
    {
        $this->_error(array(
            'acquisitionSoftware' => $message,
            'imageDirectory' => $message,
            'imageSuffix' => $message,
        ), 400);
    }

    /**
     * Get enough of a DataCollection to be able to set up processing jobs
     *
     * Also check the dataCollection and proposal exist and match
     *
     * @param string $proposal
     * @param string $dataCollectionId
     */
    private function dataCollectionForProcessing($proposal, $dataCollectionId)
    {
        $rows = $this->db->pq(
            "SELECT
                DataCollection.dataCollectionId,
                DataCollection.imageDirectory,
                DataCollection.fileTemplate,
                COUNT(AutoProcProgram.autoProcProgramId) AS runningJobs
            FROM DataCollection
            LEFT JOIN ProcessingJob
                ON ProcessingJob.dataCollectionId = DataCollection.dataCollectionId
            LEFT JOIN AutoProcProgram
                ON AutoProcProgram.processingJobId = ProcessingJob.processingJobId
                AND AutoProcProgram.processingStatus IS NULL
            INNER JOIN DataCollectionGroup
                ON DataCollectionGroup.dataCollectionGroupId = DataCollection.dataCollectionGroupId
            INNER JOIN BLSession
                ON BLSession.sessionId = DataCollectionGroup.sessionId
            INNER JOIN Proposal
                ON Proposal.proposalId = BLSession.proposalId
            WHERE CONCAT(Proposal.proposalCode, Proposal.proposalNumber) = :1
            AND DataCollection.dataCollectionId = :2",
            array(
                $proposal,
                $dataCollectionId
            ),
            false
        );

        if (sizeof($rows) == 0) {
            $this->_error('No data collection');
        }

        return $rows[0];
    }

    /**
     * Returns dataCollectionId of first DataCollection associated with session
     *
     * Also checks for existing imageDirectory
     *
     * @param string $sessionId
     * @param string $imageDirectory
     * @param string $fileTemplate
     *
     * @return array|null
     */
    private function dataCollectionFindExisting(
        $sessionId,
        $imageDirectory,
        $fileTemplate
    ) {
        if (!$sessionId) {
            return null;
        }

        $rows = $this->db->pq(
            "SELECT dataCollectionId FROM DataCollection
                WHERE SESSIONID=:1 AND imageDirectory=:2 AND fileTemplate=:3
                LIMIT 1",
            array($sessionId, $imageDirectory, $fileTemplate),
            false
        );

        if (count($rows) == 0) {
            return null;
        }

        return $rows[0]['dataCollectionId'];
    }
}
