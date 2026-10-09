import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronLeft,
  Copy,
  Eye,
  BarChart3,
  Calendar,
  Layers,
  HelpCircle,
  Clock,
  Radio,
  CheckSquare,
  AlignLeft,
  ChevronRight,
  ShieldCheck,
  Send
} from 'lucide-react';
import {
  googleFormsService,
  GoogleFormSummary,
  GoogleFormDetail,
  GoogleFormQuestionItem,
  GoogleFormSubmission
} from '../../services/googleFormsService';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { soundEffects } from '../../utils/sound';

interface FormsAppProps {
  onClose: () => void;
  onOpenLaterPhase?: (title: string, desc: string, feat?: string) => void;
}

export const FormsApp: React.FC<FormsAppProps> = ({ onClose }) => {
  const { currentUser } = useAuth();
  const { language, isRtl, t } = useLanguage();

  // Connection & Auth state
  const [hasToken, setHasToken] = useState<boolean>(googleFormsService.hasValidToken());
  const [isConnecting, setIsConnecting] = useState(false);

  // Forms list state
  const [forms, setForms] = useState<GoogleFormSummary[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Detail / Inspect state
  const [selectedFormDetail, setSelectedFormDetail] = useState<GoogleFormDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Responses state
  const [activeResponsesFormId, setActiveResponsesFormId] = useState<string | null>(null);
  const [responses, setResponses] = useState<GoogleFormSubmission[]>([]);
  const [totalResponses, setTotalResponses] = useState<number>(0);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);

  // Create Form Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newQuestions, setNewQuestions] = useState<GoogleFormQuestionItem[]>([
    {
      title: 'Full Name',
      type: 'TEXT',
      required: true
    },
    {
      title: 'Feedback Rating',
      type: 'SCALE',
      scaleLow: 1,
      scaleHigh: 5,
      scaleLowLabel: 'Needs Work',
      scaleHighLabel: 'Superb',
      required: true
    }
  ]);
  const [isCreating, setIsCreating] = useState(false);

  // Delete Form Confirmation Modal (MANDATORY User Confirmation as per Skill)
  const [formToDelete, setFormToDelete] = useState<GoogleFormSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add Question Modal state
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [targetFormForQuestion, setTargetFormForQuestion] = useState<GoogleFormDetail | null>(null);
  const [questionTitle, setQuestionTitle] = useState('');
  const [questionType, setQuestionType] = useState<GoogleFormQuestionItem['type']>('TEXT');
  const [questionOptions, setQuestionOptions] = useState<string[]>(['Option 1', 'Option 2']);
  const [questionRequired, setQuestionRequired] = useState(false);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Check token and load forms
  useEffect(() => {
    if (googleFormsService.hasValidToken()) {
      setHasToken(true);
      loadFormsList();
    }
  }, []);

  const handleConnectGoogle = async () => {
    soundEffects.playHapticClick();
    setIsConnecting(true);
    setErrorMessage(null);
    try {
      await googleFormsService.requestWorkspaceAccess();
      setHasToken(true);
      showToast(language === 'ar' ? 'تم ربط Google Workspace بنجاح' : 'Connected to Google Workspace');
      loadFormsList();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to authenticate with Google Workspace.');
    } finally {
      setIsConnecting(false);
    }
  };

  const loadFormsList = async () => {
    setIsLoadingForms(true);
    setErrorMessage(null);
    try {
      const list = await googleFormsService.listForms();
      setForms(list);
    } catch (err: any) {
      if (err.message?.includes('expired') || err.message?.includes('required')) {
        setHasToken(false);
      }
      setErrorMessage(err.message || 'Could not load Google Forms.');
    } finally {
      setIsLoadingForms(false);
    }
  };

  const handleOpenFormDetail = async (form: GoogleFormSummary) => {
    soundEffects.playHapticClick();
    setIsLoadingDetail(true);
    try {
      const detail = await googleFormsService.getForm(form.id);
      setSelectedFormDetail(detail);
    } catch (err: any) {
      showToast(err.message || 'Could not fetch form details.');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleViewResponses = async (formId: string) => {
    soundEffects.playHapticClick();
    setIsLoadingResponses(true);
    setActiveResponsesFormId(formId);
    try {
      const res = await googleFormsService.getResponses(formId);
      setResponses(res.responses);
      setTotalResponses(res.total);
    } catch (err: any) {
      showToast(err.message || 'Could not load form responses.');
    } finally {
      setIsLoadingResponses(false);
    }
  };

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    soundEffects.playHapticClick();
    setIsCreating(true);
    try {
      const created = await googleFormsService.createForm({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        questions: newQuestions.filter((q) => q.title.trim().length > 0)
      });
      showToast(
        language === 'ar' ? `تم إنشاء النموذج "${created.info.title}"` : `Form "${created.info.title}" created!`
      );
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      loadFormsList();
      setSelectedFormDetail(created);
    } catch (err: any) {
      showToast(err.message || 'Failed to create form.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!formToDelete) return;
    soundEffects.playHapticClick();
    setIsDeleting(true);
    try {
      await googleFormsService.deleteForm(formToDelete.id);
      showToast(
        language === 'ar' ? `تم حذف النموذج من Google Drive` : `Form deleted from Google Drive`
      );
      setForms((prev) => prev.filter((f) => f.id !== formToDelete.id));
      if (selectedFormDetail?.formId === formToDelete.id) {
        setSelectedFormDetail(null);
      }
      setFormToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete form.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFormForQuestion || !questionTitle.trim()) return;

    soundEffects.playHapticClick();
    setIsAddingQuestion(true);
    try {
      const qItem: GoogleFormQuestionItem = {
        title: questionTitle.trim(),
        type: questionType,
        required: questionRequired,
        options:
          questionType === 'RADIO' || questionType === 'CHECKBOX' || questionType === 'DROP_DOWN'
            ? questionOptions.map((opt) => ({ value: opt }))
            : undefined
      };

      const currCount = targetFormForQuestion.items?.length || 0;
      await googleFormsService.addQuestion(targetFormForQuestion.formId, qItem, currCount);
      showToast(language === 'ar' ? 'تمت إضافة السؤال للنموذج' : 'Question added to form!');
      setShowAddQuestionModal(false);
      setQuestionTitle('');

      // Refresh form details
      const refreshed = await googleFormsService.getForm(targetFormForQuestion.formId);
      setSelectedFormDetail(refreshed);
    } catch (err: any) {
      showToast(err.message || 'Could not add question.');
    } finally {
      setIsAddingQuestion(false);
    }
  };

  const filteredForms = forms.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 bg-[#030712] text-slate-100 flex flex-col font-sans select-none overflow-hidden animate-fadeIn"
    >
      {/* Toast Alert */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-purple-950/90 border border-purple-500/50 text-purple-200 text-xs shadow-2xl backdrop-blur-md font-mono flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="h-14 px-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundEffects.playHapticClick();
              onClose();
            }}
            className="w-8 h-8 rounded-xl aerix-glass border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/10">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-display text-white flex items-center gap-1.5">
                <span>Google Forms</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Workspace
                </span>
              </h1>
              <p className="text-[10px] font-mono text-slate-400">
                {currentUser?.email || 'Google Workspace Integration'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasToken && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'نموذج جديد' : 'New Form'}</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl aerix-glass border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 max-w-4xl mx-auto w-full space-y-4 pb-20">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-xs text-rose-300 animate-shake">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">Google Workspace Notice</span>
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-200 text-xs px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* NOT CONNECTED STATE: Official Google Material Sign-In Button */}
        {!hasToken && (
          <div className="py-12 px-6 rounded-3xl aerix-glass border border-purple-500/30 text-center space-y-5 max-w-md mx-auto my-8">
            <div className="w-16 h-16 rounded-3xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center mx-auto shadow-xl shadow-purple-500/20">
              <FileText className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-base font-bold font-display text-white">
                {language === 'ar' ? 'ربط نماذج Google Forms' : 'Connect Google Forms'}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === 'ar'
                  ? 'قم بتسجيل الدخول بحساب Google Workspace لإنشاء النماذج، وتعديل الأسئلة، واستعراض الإجابات في الوقت الفعلي مع إذن المستخدم.'
                  : 'Authenticate with your Google Workspace account to read, create, update forms, and monitor real-time survey responses with permission.'}
              </p>
            </div>

            {/* Google Material Button */}
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={isConnecting}
                className="py-2.5 px-5 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-2xl shadow-xl flex items-center justify-center gap-3 text-xs active:scale-98 transition-all disabled:opacity-50"
              >
                {isConnecting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                )}
                <span>
                  {language === 'ar'
                    ? 'تسجيل الدخول باستخدام Google'
                    : 'Sign in with Google Workspace'}
                </span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-slate-500 pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>OAuth 2.0 Client-Side Token Isolation</span>
            </div>
          </div>
        )}

        {/* CONNECTED STATE: Forms List & Controls */}
        {hasToken && (
          <div className="space-y-4">
            {/* Search & Refresh Bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    language === 'ar'
                      ? 'البحث في نماذج Google Forms...'
                      : 'Search Google Forms by title...'
                  }
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                onClick={loadFormsList}
                disabled={isLoadingForms}
                className="w-10 h-10 rounded-2xl aerix-glass border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                title="Refresh Forms"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingForms ? 'animate-spin text-purple-400' : ''}`} />
              </button>
            </div>

            {/* Forms Grid */}
            {isLoadingForms && forms.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin text-purple-400 mx-auto" />
                <p className="text-xs text-slate-400 font-mono">
                  Loading Google Forms from Drive...
                </p>
              </div>
            ) : filteredForms.length === 0 ? (
              <div className="p-12 rounded-3xl aerix-glass border border-slate-800 text-center space-y-3">
                <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-white">No Google Forms Found</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {searchQuery
                    ? `No forms match "${searchQuery}"`
                    : 'You do not have any Google Forms in Drive yet. Tap "New Form" to create your first one.'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-2 py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create My First Form</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredForms.map((form) => (
                  <div
                    key={form.id}
                    className="p-4 rounded-3xl aerix-glass border border-slate-800 hover:border-purple-500/40 transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <h3 className="text-xs font-bold text-white truncate max-w-[200px]">
                            {form.name}
                          </h3>
                        </div>

                        {/* Delete Form Trigger (opens mandatory confirmation modal) */}
                        <button
                          onClick={() => setFormToDelete(form)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete form from Google Drive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {form.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-2">
                          {form.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 pt-1">
                        <Clock className="w-3 h-3 text-slate-600" />
                        <span>
                          {form.modifiedTime
                            ? new Date(form.modifiedTime).toLocaleDateString()
                            : 'Google Form'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-850">
                      <button
                        onClick={() => handleOpenFormDetail(form)}
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 text-[11px] font-semibold text-slate-200 hover:text-white flex items-center justify-center gap-1 transition-colors"
                      >
                        <Eye className="w-3 h-3 text-purple-400" />
                        <span>Inspect</span>
                      </button>

                      <button
                        onClick={() => handleViewResponses(form.id)}
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 text-[11px] font-semibold text-slate-200 hover:text-white flex items-center justify-center gap-1 transition-colors"
                      >
                        <BarChart3 className="w-3 h-3 text-indigo-400" />
                        <span>Responses</span>
                      </button>

                      {form.webViewLink && (
                        <a
                          href={form.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl aerix-glass border border-slate-800 text-slate-400 hover:text-purple-300 transition-colors"
                          title="Open in Google Forms Editor"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FORM DETAIL / INSPECT MODAL */}
      {selectedFormDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-xl max-h-[85vh] rounded-3xl aerix-glass border border-purple-500/40 flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {selectedFormDetail.info.title}
                  </h3>
                  <span className="text-[10px] font-mono text-purple-300">
                    ID: {selectedFormDetail.formId}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedFormDetail(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 no-scrollbar">
              {selectedFormDetail.info.description && (
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                  {selectedFormDetail.info.description}
                </div>
              )}

              {/* Responder URL */}
              {selectedFormDetail.responderUri && (
                <div className="p-3 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between gap-2">
                  <div className="truncate text-xs text-purple-200">
                    <span className="text-[10px] uppercase font-mono block text-purple-400">
                      Public Responder URL
                    </span>
                    <span className="truncate">{selectedFormDetail.responderUri}</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedFormDetail.responderUri || '');
                      showToast('Responder link copied!');
                    }}
                    className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white shrink-0"
                    title="Copy Link"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
                    Questions ({selectedFormDetail.items?.length || 0})
                  </h4>

                  <button
                    onClick={() => {
                      setTargetFormForQuestion(selectedFormDetail);
                      setShowAddQuestionModal(true);
                    }}
                    className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Question</span>
                  </button>
                </div>

                {!selectedFormDetail.items || selectedFormDetail.items.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    No questions added yet. Tap "Add Question" to append fields.
                  </p>
                ) : (
                  selectedFormDetail.items.map((item, idx) => (
                    <div
                      key={item.itemId || idx}
                      className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-purple-400">
                            #{idx + 1}
                          </span>
                          <span className="text-xs font-bold text-white">{item.title}</span>
                          {item.questionItem?.question?.required && (
                            <span className="text-[10px] text-rose-400 font-mono">*required</span>
                          )}
                        </div>
                      </div>

                      {item.questionItem?.question?.choiceQuestion?.options && (
                        <div className="space-y-1 pl-6 pt-1">
                          {item.questionItem.question.choiceQuestion.options.map((opt, oIdx) => (
                            <div key={oIdx} className="text-xs text-slate-400 flex items-center gap-2">
                              <Radio className="w-3 h-3 text-purple-400" />
                              <span>{opt.value}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {item.questionItem?.question?.scaleQuestion && (
                        <div className="text-xs text-slate-400 pl-6 flex items-center gap-3">
                          <span className="font-mono text-purple-300">
                            Scale: {item.questionItem.question.scaleQuestion.low} -{' '}
                            {item.questionItem.question.scaleQuestion.high}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-800 flex justify-between items-center bg-slate-900/60">
              <button
                onClick={() => handleViewResponses(selectedFormDetail.formId)}
                className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>View Responses</span>
              </button>

              <button
                onClick={() => setSelectedFormDetail(null)}
                className="px-4 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORM RESPONSES VIEWER MODAL */}
      {activeResponsesFormId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-xl max-h-[85vh] rounded-3xl aerix-glass border border-indigo-500/40 flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Form Responses</h3>
                  <span className="text-[10px] font-mono text-indigo-300">
                    Total Submissions: {totalResponses}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveResponsesFormId(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 no-scrollbar">
              {isLoadingResponses ? (
                <div className="py-10 text-center space-y-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-indigo-400 mx-auto" />
                  <p className="text-xs text-slate-400 font-mono">Fetching response records...</p>
                </div>
              ) : responses.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <p className="text-xs text-slate-400">No responses recorded yet for this form.</p>
                </div>
              ) : (
                responses.map((resp, i) => (
                  <div
                    key={resp.responseId || i}
                    className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-indigo-300 border-b border-slate-850 pb-1.5">
                      <span>Submission #{i + 1}</span>
                      <span>
                        {resp.lastSubmittedTime
                          ? new Date(resp.lastSubmittedTime).toLocaleString()
                          : 'Recent'}
                      </span>
                    </div>

                    {resp.answers && (
                      <div className="space-y-1.5 pt-1">
                        {Object.entries(resp.answers).map(([qId, ans]) => (
                          <div key={qId} className="text-xs">
                            <span className="text-slate-500 font-mono text-[10px] block">
                              Question ID: {qId}
                            </span>
                            <span className="text-slate-200">
                              {ans.textAnswers?.answers?.map((a) => a.value).join(', ') || 'No answer'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-slate-800 flex justify-end bg-slate-900/60">
              <button
                onClick={() => setActiveResponsesFormId(null)}
                className="px-4 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW FORM MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-lg max-h-[90vh] rounded-3xl aerix-glass border border-purple-500/40 p-5 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />
                {language === 'ar' ? 'إنشاء نموذج Google Forms جديد' : 'Create Google Form'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateForm} className="space-y-4 overflow-y-auto no-scrollbar pr-1">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Form Title *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Client Onboarding Survey"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe the purpose of this form..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              {/* Initial Questions */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-purple-300 uppercase">
                    Initial Questions ({newQuestions.length})
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setNewQuestions((prev) => [
                        ...prev,
                        { title: `Question ${prev.length + 1}`, type: 'TEXT', required: false }
                      ])
                    }
                    className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Field</span>
                  </button>
                </div>

                {newQuestions.map((q, qIndex) => (
                  <div
                    key={qIndex}
                    className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={q.title}
                        onChange={(e) =>
                          setNewQuestions((prev) => {
                            const next = [...prev];
                            next[qIndex].title = e.target.value;
                            return next;
                          })
                        }
                        placeholder="Question title"
                        className="flex-1 bg-transparent text-xs text-white border-b border-slate-700 pb-1 focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setNewQuestions((prev) => prev.filter((_, i) => i !== qIndex))
                        }
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <select
                        value={q.type}
                        onChange={(e) =>
                          setNewQuestions((prev) => {
                            const next = [...prev];
                            next[qIndex].type = e.target.value as any;
                            return next;
                          })
                        }
                        className="bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-slate-300 px-2 py-1"
                      >
                        <option value="TEXT">Short Answer</option>
                        <option value="PARAGRAPH_TEXT">Paragraph</option>
                        <option value="RADIO">Multiple Choice</option>
                        <option value="CHECKBOX">Checkboxes</option>
                        <option value="SCALE">Linear Scale (1-5)</option>
                      </select>

                      <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) =>
                            setNewQuestions((prev) => {
                              const next = [...prev];
                              next[qIndex].required = e.target.checked;
                              return next;
                            })
                          }
                          className="w-3.5 h-3.5 accent-purple-500"
                        />
                        <span>Required</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isCreating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create in Google Drive</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD QUESTION TO EXISTING FORM MODAL */}
      {showAddQuestionModal && targetFormForQuestion && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl aerix-glass border border-purple-500/40 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Add Question</h3>
              <button onClick={() => setShowAddQuestionModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddQuestionSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Question Prompt *
                </label>
                <input
                  type="text"
                  value={questionTitle}
                  onChange={(e) => setQuestionTitle(e.target.value)}
                  placeholder="e.g., How did you hear about us?"
                  required
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Field Type
                </label>
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="TEXT">Short Answer Text</option>
                  <option value="PARAGRAPH_TEXT">Paragraph Text</option>
                  <option value="RADIO">Multiple Choice (Radio)</option>
                  <option value="CHECKBOX">Checkboxes</option>
                  <option value="DROP_DOWN">Drop Down</option>
                  <option value="SCALE">Linear Scale</option>
                </select>
              </div>

              {(questionType === 'RADIO' || questionType === 'CHECKBOX' || questionType === 'DROP_DOWN') && (
                <div className="space-y-2">
                  <label className="text-[11px] font-mono text-purple-300 block">
                    Options
                  </label>
                  {questionOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const next = [...questionOptions];
                          next[idx] = e.target.value;
                          setQuestionOptions(next);
                        }}
                        className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                      {questionOptions.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setQuestionOptions((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setQuestionOptions((prev) => [...prev, `Option ${prev.length + 1}`])
                    }
                    className="text-[11px] text-purple-400 hover:underline"
                  >
                    + Add option
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={questionRequired}
                    onChange={(e) => setQuestionRequired(e.target.checked)}
                    className="w-4 h-4 accent-purple-500"
                  />
                  <span>Mark as Required</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingQuestion || !questionTitle.trim()}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                >
                  {isAddingQuestion ? 'Saving...' : 'Add to Form'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANDATORY USER CONFIRMATION MODAL FOR DELETING A FORM (As per Workspace Skill) */}
      {formToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl aerix-glass border border-rose-500/50 p-5 space-y-4 shadow-2xl">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Delete Google Form?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to permanently delete <strong>"{formToDelete.name}"</strong> from your Google Drive? This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setFormToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5"
              >
                {isDeleting && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>Delete Form</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
