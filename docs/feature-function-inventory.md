# DexEnhance Feature and Function Inventory (2026-03-05)

## Feature Inventory
- Cross-site host adapters: ChatGPT + Gemini (`src/content/chatgpt/adapter.js`, `src/content/gemini/adapter.js`)
- Injected in-page UI shell: Shadow DOM + Preact panels (`src/content/chatgpt/index.js`, `src/content/gemini/index.js`, `src/ui/components/*`)
- Queue interception/autosend (`src/content/shared/queue-controller.js`, `src/content/shared/queue.js`)
- Prompt library CRUD + variable substitution (`src/ui/components/PromptLibrary.jsx`, background prompt handlers in `src/background/service_worker.js`)
- Folder tree organization + trash/restore/permanent-delete (`src/ui/components/FolderTree.jsx`, background folder handlers in `src/background/service_worker.js`)
- Prompt optimizer (deterministic local rewrite + same-tab/hidden-tab AI refinement)
- Semantic Clipboard ingestion/query/preamble (`src/content/shared/semantic-clipboard-client.js`, `src/background/semantic-clipboard-db.js`)
- Pop-out canvas session workflow (`src/content/shared/popout-canvas-controller.js`, background canvas handlers in `src/background/service_worker.js`)
- Export to PDF/DOCX (`src/content/shared/exporter.js`)
- Token/model overlay via API bridge (`src/content/shared/api-bridge.js`, `src/ui/components/TokenOverlay.jsx`)
- Feature settings + module toggles (`src/lib/feature-settings.js`, popup + content settings integration)
- Popup launcher/settings/tour surface (`src/popup/index.html`, `src/popup/index.js`)
- HUD layout/theme persistence (`src/lib/ui-settings.js`, `src/ui/components/HUDSettingsPanel.jsx`)

## Function and Method Inventory
(Generated from named functions, exported functions/classes, and class methods in `src/`.)

### `src/background/api_interceptor.js`
- L7: function hasDynamicRulesApi() {
- L16: function normalizeRules(rules) {
- L28: export async function updateRules(rules) {
- L55: export async function clearRules() {

### `src/background/semantic-clipboard-db.js`
- L13: function clampInt(value, min, max, fallback) {
- L20: function normalizeSourceUrl(rawUrl) {
- L33: function requestToPromise(request) {
- L40: function transactionDone(transaction) {
- L48: function createStoreIfMissing(database, upgradeTransaction, storeName, options) {
- L55: function setupIndexes(store, definitions) {
- L63: async function sha256Hex(value) {
- L74: function deterministicEmbedding(text, dimension) {
- L100: function cosineSimilarity(lhsVector, lhsNorm, rhsVector, rhsNorm) {
- L117: function normalizeChunkInput(chunks) {
- L144: function truncateForPreamble(value, maxLength = 360) {
- L150: function getDb() {
- L195: async function collectMostRecentSourceUrls(tabStore, maxTrackedTabs) {
- L212: async function pruneExcessSources(tabStore, chunkStore, maxTrackedTabs) {
- L237: async function writeQueryCache(queryStore, entry) {
- L254: export async function upsertSemanticClipboardContext({
- L335: export async function querySemanticClipboard({
- L420: export async function buildSemanticClipboardPreamble({
- L448: export async function getSemanticClipboardStats() {

### `src/background/service_worker.js`
- L57: function ok(data) {
- L61: function fail(error) {
- L69: function isRecord(value) {
- L73: function createId() {
- L80: function normalizeChatUrl(chatUrl) {
- L92: function parseVariablesFromPromptBody(body) {
- L104: function promptFingerprint(prompt) {
- L110: function sleep(ms) {
- L114: function clampInt(value, min, max, fallback) {
- L121: function byteLength(value) {
- L129: function createClaimToken() {
- L140: function siteFromUrl(value) {
- L152: function isAllowedChatSender(sender) {
- L157: function normalizeCanvasSite(site, fallbackUrl) {
- L162: function normalizeCodeBundle(input) {
- L183: function removeCanvasSession(sessionId) {
- L195: function cleanupExpiredCanvasSessions(now = Date.now()) {
- L203: function cleanupCanvasSessionsByTabId(tabId) {
- L213: async function ensureCanvasSweepAlarm() {
- L220: async function openCanvasFromChat(sender, message) {
- L281: function getCanvasSessionOrThrow(sessionId) {
- L290: async function claimCanvasSession(sender, message) {
- L325: async function updateCanvasSession(sender, message) {
- L372: async function closeCanvasSession(sender, message) {
- L389: function normalizeRuntimeFeatureSettings(value) {
- L393: async function getFeatureSettings() {
- L399: async function ensureFeatureSettingsInitialized() {
- L417: async function updateFeatureSettingsModule(moduleId, patch) {
- L426: async function replaceFeatureSettings(nextSettings) {
- L434: async function ensureSemanticEmbeddingRuntime() {
- L473: function normalizeOptimizerSite(site) {
- L478: function getOptimizerSiteUrl(site) {
- L484: async function waitForOptimizerWorkerReady(tabId, timeoutMs = 45000) {
- L511: async function runHiddenTabRefinement({ site, prompt }) {
- L573: function normalizePrompt(prompt) {
- L589: function normalizeFolder(folder) {
- L602: async function loadFolderState() {
- L618: async function loadPromptState() {
- L656: async function savePromptState(prompts) {
- L662: async function saveFolderState({ folders, chatFolderMap }) {
- L669: function collectDescendantIds(folders, rootId) {
- L690: async function getFolderTree(includeDeleted) {
- L696: async function createFolder(name, parentId) {
- L724: async function renameFolder(id, name) {
- L738: async function softDeleteFolder(id) {
- L756: async function restoreFolder(id) {
- L776: async function permanentlyDeleteFolder(id) {
- L793: async function assignChatToFolder(id, chatUrl) {
- L813: async function unassignChat(chatUrl) {
- L827: async function getFolderByChatUrl(chatUrl) {
- L844: async function listPrompts() {
- L848: async function createPrompt(data) {
- L867: async function updatePrompt(data) {
- L887: async function deletePrompt(id) {
- L902: async function handleMessage(message, sender) {

### `src/content/chatgpt/adapter.js`
- L6: export class ChatGPTAdapter extends ChatInterface {
- L7:   _textFromNode(node) {
- L15:   _hashText(value) {
- L25:   _getLatestAssistantNode() {
- L49:   getTextarea() {
- L65:   getSubmitButton() {
- L81:   getChatListContainer() {
- L97:   isGenerating() {
- L110:   getLatestAssistantTurnText() {
- L115:   getLatestAssistantTurnId() {

### `src/content/chatgpt/index.js`
- L55: async function getEnabledFlag() {
- L64: async function logStorageRoundTrip() {

### `src/content/gemini/adapter.js`
- L6: export class GeminiAdapter extends ChatInterface {
- L7:   _textFromNode(node) {
- L15:   _hashText(value) {
- L25:   _getLatestAssistantNode() {
- L44:   getTextarea() {
- L60:   getSubmitButton() {
- L76:   getChatListContainer() {
- L93:   isGenerating() {
- L106:   getLatestAssistantTurnText() {
- L111:   getLatestAssistantTurnId() {

### `src/content/gemini/index.js`
- L55: async function getEnabledFlag() {
- L64: async function logStorageRoundTrip() {

### `src/content/shared/api-bridge.js`
- L10: export function injectApiBridge() {
- L32: export function subscribeToApiBridge(callback) {

### `src/content/shared/chat-interface.js`
- L6: export class ChatInterface {
- L7:   constructor() {
- L24:   getTextarea() { return null; }
- L27:   getSubmitButton() { return null; }
- L30:   getChatListContainer() { return null; }
- L33:   isGenerating() { return false; }
- L36:   getLatestAssistantTurnText() { return ''; }
- L39:   getLatestAssistantTurnId() { return ''; }
- L46:   onGeneratingStart(callback) {
- L56:   onGeneratingEnd(callback) {
- L66:   onNewChat(callback) {
- L71:   startObservers() {
- L151:   stopObservers() {
- L166:   _emit(eventName, payload) {

### `src/content/shared/exporter.js`
- L8: function timestampLabel() {
- L13: function triggerBlobDownload(blob, filename) {
- L28: export function exportToPdf(turns, options) {
- L79: export async function exportToDocx(turns, options) {

### `src/content/shared/feature-flags.js`
- L4: export async function fetchFeatureSettings() {
- L12: export function watchFeatureSettings(onChange) {

### `src/content/shared/input-utils.js`
- L1: function setNativeValue(inputEl, value) {
- L15: export function readTextFromInputElement(inputEl) {
- L29: export function writeTextToInputElement(inputEl, text) {
- L49: export function clearTextInInputElement(inputEl) {
- L58: export function insertTextThroughAdapter(adapter, text) {

### `src/content/shared/parser.js`
- L4: function cleanText(raw) {
- L11: function textFromElement(element) {
- L19: function compareDomOrder(a, b) {
- L31: function collectNodesByRole(candidates) {
- L53: function extractMessages(roleNodes) {
- L66: function parseChatGPTConversation() {
- L89: function parseGeminiConversation() {
- L107: export function parseConversation() {

### `src/content/shared/popout-canvas-controller.js`
- L3: function normalizeCodeBundle(value) {
- L12: function isHtmlLanguage(language) {
- L16: function isCssLanguage(language) {
- L20: function isJavaScriptLanguage(language) {
- L24: function splitCodeFences(text) {
- L41: export function extractCodeBundleFromText(text) {
- L61: export function hasRunnableCodeBundle(codeBundle) {
- L66: export async function openPopoutCanvasFromLatestTurn({ adapter, site, chatUrl }) {
- L88: export function createPopoutCanvasController({ adapter, site, getFeatureSettings }) {

### `src/content/shared/prompt-optimizer.js`
- L8: function sleep(ms) {
- L12: function normalizeWhitespace(value) {
- L16: function splitStatements(text) {
- L30: function toBulletList(items, fallback) {
- L35: function detectFormatHints(text) {
- L48: function classifyStatements(statements) {
- L69: export function deterministicRewritePrompt(rawPrompt) {
- L100: function createRefinementMetaPrompt(localPrompt) {
- L115: function extractOptimizedPrompt(responseText) {
- L128: function captureAssistantSnapshot() {
- L138: function hasNewAssistant(before, after) {
- L145: function isDisabledElement(element) {
- L152: function dispatchEnterKey(target) {
- L169: async function submitRefinementPayload({ adapter, inputEl }) {
- L199: async function waitUntilIdle(adapter, timeoutMs = 15000) {
- L208: export async function runAiRefinementInCurrentTab({ adapter, localPrompt, timeoutMs = 90000 }) {
- L259: export function readCurrentComposerText(adapter) {
- L264: export function writeOptimizedComposerText(adapter, text) {
- L273: export function registerOptimizerWorkerListener({ adapter }) {

### `src/content/shared/queue-controller.js`
- L16: export function setupQueueController({ adapter, siteLabel, onQueueSizeChange }) {

### `src/content/shared/queue.js`
- L7: export function createQueue() {

### `src/content/shared/semantic-clipboard-client.js`
- L4: function normalizeChunkText(text) {
- L8: export function chunkTextForSemanticClipboard(text, chunkSize = 680, overlap = 120) {
- L36: export async function ingestSemanticClipboardContext({
- L55: export async function buildSemanticClipboardPreamble({ queryText, topK, maxTrackedTabs }) {
- L63: export function prependPreambleToComposer(adapter, preamble, originalText) {

### `src/lib/feature-settings.js`
- L30: function clampInt(value, min, max, fallback) {
- L37: function normalizeModuleSettings(moduleId, value) {
- L81: function emptyModules() {
- L93: export function normalizeFeatureSettings(value) {
- L109: export function featureModuleIds() {
- L113: export function updateFeatureModule(settings, moduleId, patch) {
- L142: export function replaceFeatureSettings(nextSettings) {

### `src/lib/message-protocol.js`
- L49: export async function sendRuntimeMessage(action, payload = {}) {

### `src/lib/storage.js`
- L13: export async function storageGet(keys) {
- L22: export async function storageGetOne(key) {
- L32: export async function storageSet(items) {
- L41: export async function storageRemove(keys) {
- L50: export async function storageClear() {
- L59: export function onStorageChange(callback) {

### `src/lib/ui-settings.js`
- L42: function clamp(value, min, max) {
- L48: function viewportOrFallback(viewport) {
- L54: function centerX(width, viewportWidth) {
- L58: function centerY(height, viewportHeight) {
- L62: export function panelMinSize(panelId) {
- L89: export function defaultPanelState(panelId, viewport) {
- L230: export function clampPanelState(panelState, viewport, minWidth = 180, minHeight = 80) {
- L249: export function normalizePanelState(rawPanel, fallback, viewport, panelId = 'unknown') {
- L265: function normalizeVisibility(rawVisibility) {
- L275: export function normalizeHudSettings(rawSettings, viewport) {
- L299: export function updatePanelInSettings(settings, panelId, patch, viewport) {
- L320: export function updatePanelVisibilityInSettings(settings, panelId, isOpen, viewport) {
- L332: export function updateThemeInSettings(settings, patch, viewport) {
- L341: export function resetPanelInSettings(settings, panelId, viewport) {
- L352: export function panelOpacityValue(value) {
- L356: export function hueToHudPalette(hue) {
- L365: export function hudBackgroundPalette(settings) {

### `src/lib/utils.js`
- L9: export function sanitize(str) {
- L25: export function truncate(str, maxLength, suffix = '...') {
- L38: export function estimateTokens(str) {

### `src/popup/index.js`
- L42: function renderStep() {
- L55: function setModalOpen(target, isOpen) {
- L61: function setStatus(message) {
- L66: function applyHueValue(value) {
- L76: async function persistHudSettings(next, message = 'Saved HUD settings.') {
- L91: async function loadHudSettings() {
- L108: function paintFeatureToggles() {
- L115: async function loadFeatureSettings() {
- L128: async function updateFeatureToggle(moduleId, enabled) {
- L144: async function markTourSeen() {
- L155: async function maybeAutoOpenTour() {

### `src/ui/components/BrandBadge.jsx`
- L3: export function BrandBadge({ iconUrl = '', site = '', onClick }) {

### `src/ui/components/ExportDialog.jsx`
- L5: export function ExportDialog({

### `src/ui/components/FAB.jsx`
- L4: function GripIcon() {
- L22: export function FAB({

### `src/ui/components/FeatureTourModal.jsx`
- L6: export function FeatureTourModal({

### `src/ui/components/FolderTree.jsx`
- L5: async function callAction(action, payload = {}) {
- L13: function sortByCreatedAt(a, b) {
- L17: export function FolderTree({ currentChatUrl }) {

### `src/ui/components/HUDSettingsPanel.jsx`
- L15: export function HUDSettingsPanel({

### `src/ui/components/PanelFrame.jsx`
- L6: function isPrimaryPointer(event) {
- L10: export function PanelFrame({

### `src/ui/components/PromptLibrary.jsx`
- L6: async function callAction(action, payload = {}) {
- L12: function normalizeTags(input) {
- L18: function VariableForm({ prompt, onInsert, onCancel }) {
- L57: export function PromptLibrary({

### `src/ui/components/PromptOptimizerModal.jsx`
- L12: function normalizeSettings(value) {
- L21: export function PromptOptimizerModal({

### `src/ui/components/QuickHubPanel.jsx`
- L76: export function QuickHubPanel({

### `src/ui/components/Sidebar.jsx`
- L49: export function Sidebar({

### `src/ui/components/TokenOverlay.jsx`
- L3: export function TokenOverlay({ site, model, tokens, source, iconUrl = '', updatedAt = null, compact = false }) {

### `src/ui/components/WelcomeHandoffModal.jsx`
- L6: export function WelcomeHandoffModal({

### `src/ui/hooks/useDraggable.js`
- L3: function normalizePoint(value) {
- L10: function getShadowHostOffset(target) {
- L27: function localPointerPosition(event, offset) {
- L34: function applyBounds(point, bounds) {
- L51: export function useDraggable({

### `src/ui/shadow-renderer.js`
- L7: export function detectHostTheme() {
- L23: export function createShadowRenderer(options) {

