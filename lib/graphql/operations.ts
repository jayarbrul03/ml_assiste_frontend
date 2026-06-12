import { gql } from "@apollo/client";

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      name
      role
    }
  }
`;

export const PROJECTS_QUERY = gql`
  query Projects {
    projects {
      id
      name
      city
      description
      labelClasses {
        id
        name
        color
        sortOrder
      }
      datasets {
        id
        name
        version
        assetCount
        createdAt
      }
      taskCounts
    }
  }
`;

export const PROJECT_QUERY = gql`
  query Project($id: ID!) {
    project(id: $id) {
      id
      name
      city
      description
      labelClasses {
        id
        name
        color
        sortOrder
      }
      datasets {
        id
        name
        version
        assetCount
        createdAt
      }
      taskCounts
    }
  }
`;

export const MY_TASK_QUEUE = gql`
  query MyTaskQueue {
    myTaskQueue {
      id
      status
      projectName
      projectId
      assigneeName
      rejectionReason
      uncertaintyScore
      autolabeled
      qaScore
      qaPassed
      slaDeadline
      autolabelReviewStatus
      asset {
        id
        filename
        url
        width
        height
      }
      annotations {
        id
        labelClassId
        labelClassName
        labelClassColor
        type
        geometry
        source
        version
      }
    }
  }
`;

export const REVIEW_QUEUE = gql`
  query ReviewQueue {
    reviewQueue {
      id
      status
      projectName
      assigneeName
      submittedAt
      asset {
        id
        filename
        url
      }
      annotations {
        id
        labelClassName
        type
        source
      }
    }
  }
`;

export const TASK_QUERY = gql`
  query Task($id: ID!) {
    task(id: $id) {
      id
      status
      projectId
      projectName
      rejectionReason
      uncertaintyScore
      autolabeled
      qaScore
      qaPassed
      slaDeadline
      autolabelReviewStatus
      asset {
        id
        filename
        url
        width
        height
      }
      annotations {
        id
        labelClassId
        labelClassName
        labelClassColor
        type
        geometry
        source
        version
      }
    }
  }
`;

export const PRELABEL_PREDICTIONS = gql`
  query PrelabelPredictions($assetId: ID!) {
    prelabelPredictions(assetId: $assetId) {
      id
      labelClassId
      labelClassName
      labelClassColor
      type
      geometry
      confidence
      accepted
    }
  }
`;

export const PRELABEL_STATUS = gql`
  query PrelabelStatus($datasetId: ID!) {
    prelabelStatus(datasetId: $datasetId) {
      id
      status
      totalAssets
      processedAssets
      autolabeledAssets
      autoSubmittedAssets
      confidenceThreshold
      autolabelEnabled
      autoSubmitEnabled
      errorMessage
      completedAt
    }
  }
`;

export const DASHBOARD_SUMMARY = gql`
  query DashboardSummary($projectId: ID) {
    dashboardSummary(projectId: $projectId) {
      totalTasks
      pendingTasks
      inProgressTasks
      submittedTasks
      approvedTasks
      rejectedTasks
      autolabeledTasks
      uncertainTasks
      reviewPassRate
      prelabelAcceptanceRate
      tasksByStatus
      throughputByDay
      projectProgress
    }
  }
`;

export const CREATE_PROJECT = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      name
      city
    }
  }
`;

export const REGISTER_ASSETS = gql`
  mutation RegisterAssets($datasetId: ID!, $assets: [RegisterAssetInput!]!) {
    registerAssets(datasetId: $datasetId, assets: $assets)
  }
`;

export const CLAIM_TASK = gql`
  mutation ClaimTask($taskId: ID!) {
    claimTask(taskId: $taskId) {
      id
      status
    }
  }
`;

export const SUBMIT_TASK = gql`
  mutation SubmitTask($taskId: ID!) {
    submitTask(taskId: $taskId) {
      id
      status
    }
  }
`;

export const SAVE_ANNOTATIONS = gql`
  mutation SaveAnnotations($taskId: ID!, $annotations: [AnnotationInput!]!) {
    saveAnnotations(taskId: $taskId, annotations: $annotations) {
      id
      type
      geometry
      source
    }
  }
`;

export const CLAIM_REVIEW = gql`
  mutation ClaimReview($taskId: ID!) {
    claimReview(taskId: $taskId) {
      id
      status
    }
  }
`;

export const APPROVE_TASK = gql`
  mutation ApproveTask($taskId: ID!, $comment: String) {
    approveTask(taskId: $taskId, comment: $comment) {
      id
      status
    }
  }
`;

export const REJECT_TASK = gql`
  mutation RejectTask($taskId: ID!, $comment: String!) {
    rejectTask(taskId: $taskId, comment: $comment) {
      id
      status
    }
  }
`;

export const TRIGGER_PRELABEL = gql`
  mutation TriggerPrelabel($input: TriggerPrelabelInput!) {
    triggerPrelabel(input: $input) {
      id
      status
      totalAssets
      autolabeledAssets
      autoSubmittedAssets
    }
  }
`;

export const APPLY_PRELABELS = gql`
  mutation ApplyPrelabels($taskId: ID!) {
    applyPrelabels(taskId: $taskId) {
      id
      type
      geometry
      source
    }
  }
`;

export const ACCEPT_PRELABEL = gql`
  mutation AcceptPrelabel($predictionId: ID!, $taskId: ID!) {
    acceptPrelabelPrediction(predictionId: $predictionId, taskId: $taskId) {
      id
      type
      geometry
      source
      labelClassName
    }
  }
`;

export const REJECT_PRELABEL = gql`
  mutation RejectPrelabel($predictionId: ID!, $taskId: ID!) {
    rejectPrelabelPrediction(predictionId: $predictionId, taskId: $taskId)
  }
`;

export const RUN_AUTO_QA = gql`
  mutation RunAutoQa($taskId: ID!) {
    runAutoQa(taskId: $taskId) {
      id
      iouScore
      consensusScore
      goldStandardScore
      overallScore
      passed
      issues
    }
  }
`;

export const TASK_QA_CHECK = gql`
  query TaskQaCheck($taskId: ID!) {
    taskQaCheck(taskId: $taskId) {
      id
      iouScore
      consensusScore
      goldStandardScore
      overallScore
      passed
      issues
    }
  }
`;

export const AUTOLABEL_REVIEW_QUEUE = gql`
  query AutolabelReviewQueue {
    autolabelReviewQueue {
      id
      status
      projectName
      autolabeled
      uncertaintyScore
      autolabelReviewStatus
      assigneeName
      asset { id filename url }
      annotations { id source labelClassName type }
    }
  }
`;

export const APPROVE_AUTOLABEL = gql`
  mutation ApproveAutolabel($taskId: ID!) {
    approveAutolabelReview(taskId: $taskId) { id status }
  }
`;

export const REJECT_AUTOLABEL = gql`
  mutation RejectAutolabel($taskId: ID!, $comment: String!) {
    rejectAutolabelReview(taskId: $taskId, comment: $comment) { id status }
  }
`;

export const LABELER_QUALITY = gql`
  query LabelerQuality($projectId: ID) {
    labelerQuality(projectId: $projectId) {
      labelerId labelerName labelerEmail
      tasksAssigned tasksCompleted tasksApproved tasksRejected
      approvalRate avgQaScore slaComplianceRate avgTurnaroundHours qualityScore
    }
  }
`;

export const SLA_SUMMARY = gql`
  query SlaSummary($projectId: ID) {
    slaSummary(projectId: $projectId) {
      totalTracked overdue atRisk onTrack slaHours
    }
  }
`;

export const MODEL_VERSIONS = gql`
  query ModelVersions($projectId: ID!) {
    modelVersions(projectId: $projectId) {
      id name version description status metrics modelConfig createdAt
    }
  }
`;

export const TRAINING_FEEDBACK_STATS = gql`
  query TrainingFeedbackStats($projectId: ID!) {
    trainingFeedbackStats(projectId: $projectId) {
      total pending accepts rejects corrections
    }
  }
`;

export const CREATE_MODEL_VERSION = gql`
  mutation CreateModelVersion($input: CreateModelVersionInput!) {
    createModelVersion(input: $input) { id name version status }
  }
`;

export const ACTIVATE_MODEL_VERSION = gql`
  mutation ActivateModelVersion($versionId: ID!) {
    activateModelVersion(versionId: $versionId) { id name version status }
  }
`;

export const TRIGGER_RETRAINING = gql`
  mutation TriggerRetraining($projectId: ID!) {
    triggerRetraining(projectId: $projectId) { id name version status metrics }
  }
`;

export const BATCH_RERUN_PRELABEL = gql`
  mutation BatchRerunPrelabel($input: BatchRerunInput!) {
    batchRerunPrelabel(input: $input) {
      id status totalAssets autolabeledAssets autoSubmittedAssets
    }
  }
`;
