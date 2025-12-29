import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { unwrapResult } from '@reduxjs/toolkit';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

import { Plus, Square, CheckSquare, Trash2, X, Pencil } from 'lucide-react';

import type { AppDispatch, RootState } from '@/core/store/store';
import {
  // LESSON-LEVEL API
  listQuizzesByLesson,
  createQuizByLesson,
  updateQuizByLesson,
  deleteQuizByLesson,
  listQuestionsByLesson,
  createQuestionByLesson,
  updateQuestionByLesson,
  deleteQuestionByLesson,
  listOptionsByLesson,
  createOptionByLesson,
  updateOptionByLesson,
  deleteOptionByLesson,
} from '@/redux/slices/quiz.slice';
import { toast } from 'react-toastify';

/* ==========================================================
   VALIDATION FOR NEW QUESTION (giống module)
========================================================== */
function validateQuestionPayload(content: string, options: any[]) {
  if (!content.trim()) return { ok: false, reason: 'Question content is required.', options: [] };

  const trimmedOptions = options.filter(o => o.content.trim());

  // không nhập option nào -> OK
  if (trimmedOptions.length === 0) {
    return { ok: true, options: [] };
  }

  // có nhập thì phải hợp lệ
  if (trimmedOptions.length < 2) {
    return {
      ok: false,
      reason: 'If you add options, you must provide at least 2.',
      options: trimmedOptions,
    };
  }
  if (!trimmedOptions.some(o => o.isCorrect)) {
    return {
      ok: false,
      reason: 'If you add options, you must mark at least 1 as correct.',
      options: trimmedOptions,
    };
  }

  return { ok: true, options: trimmedOptions };
}

/* ========================================================== */

interface LessonQuizSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  baseSelected: {
    courseId?: number;
    moduleId?: number;
    lessonId?: number;
    lessonTitle?: string;
  } | null;
}

export default function LessonQuizSheet({
  open,
  onOpenChange,
  baseSelected,
}: LessonQuizSheetProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { quizzes } = useSelector((s: RootState) => s.quiz);

  // DANH SÁCH QUIZ CỦA LESSON NÀY
  // listQuizzesByLesson đã trả về đúng cho lesson, nên ở đây
  // chỉ cần dùng thẳng state.quizzes (không cần filter theo moduleId nữa)
  const lessonQuizzes = useMemo(
    () => (baseSelected?.lessonId ? (quizzes as any[]) : []),
    [quizzes, baseSelected?.lessonId],
  );

  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [editingQuizId, setEditingQuizId] = useState<number | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [editingOptionId, setEditingOptionId] = useState<number | null>(null);

  // Create / edit quiz
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizDescription, setNewQuizDescription] = useState('');

  // Preview questions
  const [previewQuestions, setPreviewQuestions] = useState<
    { id: number; content: string; explanation?: string; options: any[] }[]
  >([]);

  // MODE 1: Create / edit question
  const [questionContent, setQuestionContent] = useState('');
  const [explanation, setExplanation] = useState('');
  const [questionOptions, setQuestionOptions] = useState([
    { id: 'q-o1', content: '', isCorrect: true },
  ]);

  // MODE 2: Manage options
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [selectedQuestionContent, setSelectedQuestionContent] = useState('');
  const [newOptions, setNewOptions] = useState([{ id: 'n-o1', content: '', isCorrect: false }]);

  const resetQuestionForm = () => {
    setQuestionContent('');
    setExplanation('');
    setQuestionOptions([{ id: 'q-o1', content: '', isCorrect: true }]);
    setEditingQuestionId(null);
  };

  const resetNewOptionsForm = () => {
    setNewOptions([{ id: 'n-o1', content: '', isCorrect: false }]);
    setEditingOptionId(null);
  };

  const canSubmitQuestion =
    selectedQuizId &&
    baseSelected?.courseId &&
    baseSelected?.moduleId &&
    baseSelected?.lessonId &&
    validateQuestionPayload(questionContent, questionOptions).ok;

  const canSubmitNewOptions =
    selectedQuizId &&
    selectedQuestionId &&
    baseSelected?.courseId &&
    baseSelected?.moduleId &&
    baseSelected?.lessonId &&
    newOptions.length > 0 &&
    newOptions.every(o => o.content.trim());

  /* ==========================================================
     Load preview cho 1 quiz
  ========================================================== */
  const loadPreviewForQuiz = async (quizId: number) => {
    if (!baseSelected?.courseId || !baseSelected?.moduleId || !baseSelected?.lessonId) return;

    const resQ = await dispatch(
      listQuestionsByLesson({
        courseId: baseSelected.courseId!,
        moduleId: baseSelected.moduleId!,
        lessonId: baseSelected.lessonId!,
        quizId,
      }),
    );
    const qData: any = unwrapResult(resQ);
    const questions = qData.items || [];

    const enriched = await Promise.all(
      questions.map(async (q: any) => {
        const resO = await dispatch(
          listOptionsByLesson({
            courseId: baseSelected.courseId!,
            moduleId: baseSelected.moduleId!,
            lessonId: baseSelected.lessonId!,
            quizId,
            questionId: q.id,
          }),
        );
        const oData: any = unwrapResult(resO);
        return { ...q, options: oData.items || [] };
      }),
    );

    setPreviewQuestions(enriched);
  };

  /* ==========================================================
     Load quizzes khi mở sheet
  ========================================================== */
  useEffect(() => {
    if (!open || !baseSelected?.lessonId) return;

    setSelectedQuizId(null);
    setSelectedQuestionId(null);
    setSelectedQuestionContent('');
    setPreviewQuestions([]);
    resetQuestionForm();
    resetNewOptionsForm();

    dispatch(
      listQuizzesByLesson({
        courseId: baseSelected.courseId!,
        moduleId: baseSelected.moduleId!,
        lessonId: baseSelected.lessonId!,
      }),
    );
  }, [open, baseSelected?.courseId, baseSelected?.moduleId, baseSelected?.lessonId, dispatch]);

  /* ==========================================================
     Chọn quiz bên trái
  ========================================================== */
  const handleSelectQuiz = async (quizId: number) => {
    setSelectedQuizId(quizId);
    setSelectedQuestionId(null);
    setSelectedQuestionContent('');
    resetQuestionForm();
    resetNewOptionsForm();
    await loadPreviewForQuiz(quizId);
  };

  /* ==========================================================
     Quiz form (create / update)
  ========================================================== */
  const handleStartEditQuiz = (quiz: any) => {
    setEditingQuizId(quiz.id);
    setNewQuizTitle(quiz.title || '');
    setNewQuizDescription(quiz.description || '');
  };

  const handleSubmitQuizForm = async () => {
    if (!newQuizTitle.trim()) {
      toast.info('Please enter a quiz title');
      return;
    }
    if (!baseSelected?.courseId || !baseSelected?.moduleId || !baseSelected.lessonId) return;

    if (!editingQuizId) {
      // CREATE
      const res = await dispatch(
        createQuizByLesson({
          path: {
            courseId: baseSelected.courseId!,
            moduleId: baseSelected.moduleId!,
            lessonId: baseSelected.lessonId!,
          },
          body: {
            title: newQuizTitle.trim(),
            description: newQuizDescription,
            status: 'Draft',
          },
        }),
      );
      const quiz: any = unwrapResult(res);
      setSelectedQuizId(quiz.id);

      await dispatch(
        listQuizzesByLesson({
          courseId: baseSelected.courseId!,
          moduleId: baseSelected.moduleId!,
          lessonId: baseSelected.lessonId!,
        }),
      );
      await loadPreviewForQuiz(quiz.id);
    } else {
      // UPDATE
      await dispatch(
        updateQuizByLesson({
          path: {
            courseId: baseSelected.courseId!,
            moduleId: baseSelected.moduleId!,
            lessonId: baseSelected.lessonId!,
            quizId: editingQuizId,
          },
          body: {
            title: newQuizTitle.trim(),
            description: newQuizDescription,
          },
        }),
      );

      await dispatch(
        listQuizzesByLesson({
          courseId: baseSelected.courseId!,
          moduleId: baseSelected.moduleId!,
          lessonId: baseSelected.lessonId!,
        }),
      );

      if (selectedQuizId === editingQuizId) {
        await loadPreviewForQuiz(editingQuizId);
      }
    }

    setEditingQuizId(null);
    setNewQuizTitle('');
    setNewQuizDescription('');
  };

  const handleDeleteQuiz = async (quizId: number) => {
    if (!baseSelected?.courseId || !baseSelected?.moduleId || !baseSelected?.lessonId) return;

    const ok = window.confirm('Are you sure you want to delete this quiz?');
    if (!ok) return;

    await dispatch(
      deleteQuizByLesson({
        courseId: baseSelected.courseId!,
        moduleId: baseSelected.moduleId!,
        lessonId: baseSelected.lessonId!,
        quizId,
      }),
    );

    await dispatch(
      listQuizzesByLesson({
        courseId: baseSelected.courseId!,
        moduleId: baseSelected.moduleId!,
        lessonId: baseSelected.lessonId!,
      }),
    );

    if (selectedQuizId === quizId) {
      setSelectedQuizId(null);
      setSelectedQuestionId(null);
      setSelectedQuestionContent('');
      setPreviewQuestions([]);
      resetQuestionForm();
      resetNewOptionsForm();
    }

    if (editingQuizId === quizId) {
      setEditingQuizId(null);
      setNewQuizTitle('');
      setNewQuizDescription('');
    }
  };

  /* ==========================================================
     Create / Update QUESTION
  ========================================================== */
  const handleSubmitQuestion = async () => {
    const check: any = validateQuestionPayload(questionContent, questionOptions);
    if (!check.ok) return alert(check.reason);

    const trimmedOptions: any[] = check.options || [];

    if (
      !selectedQuizId ||
      !baseSelected?.courseId ||
      !baseSelected?.moduleId ||
      !baseSelected.lessonId
    )
      return;

    if (!editingQuestionId) {
      // CREATE
      const resQ = await dispatch(
        createQuestionByLesson({
          path: {
            courseId: baseSelected.courseId!,
            moduleId: baseSelected.moduleId!,
            lessonId: baseSelected.lessonId!,
            quizId: selectedQuizId,
          },
          body: {
            content: questionContent,
            explanation,
          },
        }),
      );
      const question: any = unwrapResult(resQ);

      // tạo options (nếu có)
      for (let i = 0; i < trimmedOptions.length; i++) {
        const opt = trimmedOptions[i];
        await dispatch(
          createOptionByLesson({
            path: {
              courseId: baseSelected.courseId!,
              moduleId: baseSelected.moduleId!,
              lessonId: baseSelected.lessonId!,
              quizId: selectedQuizId,
              questionId: question.id,
            },
            body: {
              content: opt.content,
              isCorrect: opt.isCorrect,
              optionOrder: i + 1,
            },
          }),
        );
      }
    } else {
      // UPDATE QUESTION
      await dispatch(
        updateQuestionByLesson({
          path: {
            courseId: baseSelected.courseId!,
            moduleId: baseSelected.moduleId!,
            lessonId: baseSelected.lessonId!,
            quizId: selectedQuizId,
            questionId: editingQuestionId,
          },
          body: {
            content: questionContent,
            explanation,
          },
        }),
      );
    }

    toast.success('Question saved!');
    await loadPreviewForQuiz(selectedQuizId);
    resetQuestionForm();
  };

  /* ==========================================================
     Chọn QUESTION để quản lý options
  ========================================================== */
  const handleSelectQuestion = (questionId: number) => {
    setSelectedQuestionId(questionId);
    setEditingOptionId(null);
    resetNewOptionsForm();

    const q = previewQuestions.find(q => q.id === questionId);
    if (q) {
      setSelectedQuestionContent(q.content);
    }
  };

  const handleToggleExistingOptionCorrect = async (opt: any) => {
    if (
      !baseSelected?.courseId ||
      !baseSelected?.moduleId ||
      !baseSelected.lessonId ||
      !selectedQuizId ||
      !selectedQuestionId
    )
      return;

    try {
      const q = previewQuestions.find(q => q.id === selectedQuestionId);
      const existing = q?.options || [];

      const nextValue = !opt.isCorrect;

      // ✅ nếu bạn muốn chỉ 1 đáp án đúng:
      // - nếu bật true cho opt này, tắt tất cả option khác
      if (nextValue) {
        const others = existing.filter((o: any) => o.id !== opt.id && o.isCorrect);

        // tắt các đáp án đúng khác trước
        for (const o of others) {
          await dispatch(
            updateOptionByLesson({
              path: {
                courseId: baseSelected.courseId!,
                moduleId: baseSelected.moduleId!,
                lessonId: baseSelected.lessonId!,
                quizId: selectedQuizId,
                questionId: selectedQuestionId,
                optionId: o.id,
              },
              body: { content: o.content, isCorrect: false },
            }),
          ).unwrap?.();
        }
      }

      // update option đang click
      await dispatch(
        updateOptionByLesson({
          path: {
            courseId: baseSelected.courseId!,
            moduleId: baseSelected.moduleId!,
            lessonId: baseSelected.lessonId!,
            quizId: selectedQuizId,
            questionId: selectedQuestionId,
            optionId: opt.id,
          },
          body: { content: opt.content, isCorrect: nextValue },
        }),
      ).unwrap?.();

      toast.success('Updated correct answer!');
      await loadPreviewForQuiz(selectedQuizId);
    } catch (e: any) {
      toast.error(e?.message || 'Update correct answer failed');
    }
  };

  /* ==========================================================
     Option helpers
  ========================================================== */
  const handleAddNewOptionRow = () => {
    setNewOptions(prev => [
      ...prev,
      { id: 'n-' + Math.random().toString(36).slice(2, 7), content: '', isCorrect: false },
    ]);
  };

  const handleToggleNewOptionCorrect = (id: string) => {
    setNewOptions(prev => prev.map(o => (o.id === id ? { ...o, isCorrect: !o.isCorrect } : o)));
  };

  const handleRemoveNewOption = (id: string) => {
    setNewOptions(prev => prev.filter(o => o.id !== id));
  };

  const handleSubmitNewOptions = async () => {
    if (!canSubmitNewOptions) return;
    if (
      !baseSelected?.courseId ||
      !baseSelected?.moduleId ||
      !baseSelected.lessonId ||
      !selectedQuizId ||
      !selectedQuestionId
    )
      return;

    const trimmed = newOptions.filter(o => o.content.trim());

    if (editingOptionId) {
      // EDIT 1 option – lấy row đầu tiên
      const opt = trimmed[0];
      await dispatch(
        updateOptionByLesson({
          path: {
            courseId: baseSelected.courseId!,
            moduleId: baseSelected.moduleId!,
            lessonId: baseSelected.lessonId!,
            quizId: selectedQuizId,
            questionId: selectedQuestionId,
            optionId: editingOptionId,
          },
          body: {
            content: opt.content,
            isCorrect: opt.isCorrect,
          },
        }),
      );
      toast.success('Option updated!');
    } else {
      // CREATE nhiều option
      for (let i = 0; i < trimmed.length; i++) {
        const opt = trimmed[i];
        await dispatch(
          createOptionByLesson({
            path: {
              courseId: baseSelected.courseId!,
              moduleId: baseSelected.moduleId!,
              lessonId: baseSelected.lessonId!,
              quizId: selectedQuizId,
              questionId: selectedQuestionId,
            },
            body: {
              content: opt.content,
              isCorrect: opt.isCorrect,
              optionOrder: i + 1,
            },
          }),
        );
      }
      toast.success('New options added!');
    }

    await loadPreviewForQuiz(selectedQuizId);
    resetNewOptionsForm();
  };

  /* ==========================================================
     UI
  ========================================================== */
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full md:max-w-3xl lg:max-w-5xl p-0">
        <div className="flex flex-col h-full">
          {/* HEADER */}
          <div className="border-b p-4 sticky top-0 bg-white">
            <SheetHeader>
              <SheetTitle className="flex justify-between">
                Lesson Quiz: {baseSelected?.lessonTitle}{' '}
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  <X className="w-4 h-4 mr-1" />
                </Button>
              </SheetTitle>
            </SheetHeader>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 flex-1 overflow-y-auto">
            {/* LEFT COLUMN - QUIZ LIST */}
            <div className="border-r pr-3">
              <span className="text-sm font-semibold">Quizzes in this lesson</span>

              {/* QUIZ FORM (Create / Edit) */}
              <div className="mt-2 mb-3 space-y-2">
                <Input
                  placeholder="Quiz Title..."
                  value={newQuizTitle}
                  onChange={e => setNewQuizTitle(e.target.value)}
                />
                <Textarea
                  rows={2}
                  placeholder="Quiz Description (optional)..."
                  value={newQuizDescription}
                  onChange={e => setNewQuizDescription(e.target.value)}
                />

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={handleSubmitQuizForm}
                    disabled={!newQuizTitle.trim()}
                  >
                    {editingQuizId ? 'Save Changes' : 'Create Quiz'}
                  </Button>

                  {editingQuizId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingQuizId(null);
                        setNewQuizTitle('');
                        setNewQuizDescription('');
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>

              {/* QUIZ LIST */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {lessonQuizzes.map((q: any) => (
                  <div
                    key={q.id}
                    className={`p-2 border rounded w-full flex items-start justify-between ${
                      selectedQuizId === q.id ? 'bg-slate-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Click text area to select quiz */}
                    <button className="flex-1 text-left" onClick={() => handleSelectQuiz(q.id)}>
                      <div className="font-medium">{q.title}</div>
                      <div className="text-xs text-gray-500">{q.status}</div>
                    </button>

                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleStartEditQuiz(q)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-600"
                        onClick={() => handleDeleteQuiz(q.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CENTER COLUMN - QUESTION FORM / OPTIONS MANAGER */}
            <div className="col-span-1 space-y-4">
              {!selectedQuizId && (
                <div className="text-gray-500 text-sm">Select a quiz to begin.</div>
              )}

              {/* MODE 1 - CREATE / EDIT QUESTION */}
              {selectedQuizId && !selectedQuestionId && (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      {editingQuestionId ? 'Edit Question' : 'Create New Question'}
                    </label>
                    <Textarea
                      rows={3}
                      placeholder="Question content..."
                      value={questionContent}
                      onChange={e => setQuestionContent(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium">Explanation (optional)</label>
                    <Textarea
                      rows={2}
                      placeholder="Explanation..."
                      value={explanation}
                      onChange={e => setExplanation(e.target.value)}
                    />
                  </div>

                  <Button disabled={!canSubmitQuestion} onClick={handleSubmitQuestion}>
                    Save Question
                  </Button>
                </>
              )}

              {/* MODE 2 - MANAGE OPTIONS */}
              {selectedQuizId && selectedQuestionId && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-500">Managing answers for:</div>
                        <div className="text-sm font-semibold">{selectedQuestionContent}</div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedQuestionId(null);
                          setSelectedQuestionContent('');
                          resetNewOptionsForm();
                        }}
                      >
                        + Create new question
                      </Button>
                    </div>

                    {/* EXISTING OPTIONS */}
                    <div className="space-y-2">
                      {previewQuestions
                        .find(q => q.id === selectedQuestionId)
                        ?.options.map((opt: any, idx: number) => (
                          <div
                            key={opt.id}
                            className="border rounded-md p-2 flex items-start justify-between"
                          >
                            <div className="flex-1">
                              <div className="text-xs text-gray-500 mb-1">
                                Existing option #{idx + 1}
                              </div>
                              <div
                                className={
                                  opt.isCorrect ? 'text-sm text-green-700 font-semibold' : 'text-sm'
                                }
                              >
                                {opt.content} {opt.isCorrect && '(Correct)'}
                              </div>
                            </div>

                            <div className="flex gap-1">
                              {/* EDIT OPTION */}
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7"
                                title="Correct"
                                onClick={() => handleToggleExistingOptionCorrect(opt)}
                              >
                                {opt.isCorrect ? (
                                  <CheckSquare className="h-4 w-4 text-green-700" />
                                ) : (
                                  <Square className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7"
                                onClick={() => {
                                  setEditingOptionId(opt.id);
                                  setNewOptions([
                                    {
                                      id: 'edit-' + opt.id,
                                      content: opt.content || '',
                                      isCorrect: opt.isCorrect,
                                    },
                                  ]);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>

                              {/* DELETE OPTION */}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-red-600"
                                onClick={async () => {
                                  if (
                                    !baseSelected?.courseId ||
                                    !baseSelected?.moduleId ||
                                    !baseSelected.lessonId ||
                                    !selectedQuizId ||
                                    !selectedQuestionId
                                  )
                                    return;

                                  const ok = window.confirm('Delete this option?');
                                  if (!ok) return;

                                  await dispatch(
                                    deleteOptionByLesson({
                                      courseId: baseSelected.courseId!,
                                      moduleId: baseSelected.moduleId!,
                                      lessonId: baseSelected.lessonId!,
                                      quizId: selectedQuizId,
                                      questionId: selectedQuestionId,
                                      optionId: opt.id,
                                    }),
                                  );

                                  await loadPreviewForQuiz(selectedQuizId);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}

                      {!previewQuestions.find(q => q.id === selectedQuestionId)?.options
                        ?.length && (
                        <div className="text-xs text-gray-500 italic">
                          This question has no options yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ADD / EDIT OPTIONS AREA */}
                  <div className="space-y-1 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {editingOptionId ? 'Edit Option' : 'Add New Options'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {newOptions.map(o => (
                        <div key={o.id} className="p-2 gap-2 flex items-center">
                          <div className="flex-1 space-y-1">
                            <Input
                              value={o.content}
                              onChange={e =>
                                setNewOptions(prev =>
                                  prev.map(p =>
                                    p.id === o.id ? { ...p, content: e.target.value } : p,
                                  ),
                                )
                              }
                              placeholder="Option content..."
                            />
                          </div>

                          {!editingOptionId && newOptions.length > 1 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRemoveNewOption(o.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-2">
                      <Button disabled={!canSubmitNewOptions} onClick={handleSubmitNewOptions}>
                        {editingOptionId ? 'Save Option' : 'Save Options'}
                      </Button>

                      {editingOptionId && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            resetNewOptionsForm();
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* RIGHT COLUMN - QUESTIONS PREVIEW */}
            <div className="border-l pl-3 space-y-3">
              <span className="font-semibold text-sm">Questions in this quiz</span>

              {!selectedQuizId && (
                <div className="text-xs text-gray-500">Select a quiz to view questions.</div>
              )}

              {selectedQuizId && previewQuestions.length === 0 && (
                <div className="text-xs text-gray-500 italic">This quiz has no questions yet.</div>
              )}

              {selectedQuizId &&
                previewQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className={`w-full border rounded p-2 ${
                      selectedQuestionId === q.id ? 'bg-slate-100 border-slate-400' : 'bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      {/* click vùng text để chọn question (quản lý options) */}
                      <button
                        className="text-left flex-1"
                        onClick={() => handleSelectQuestion(q.id)}
                      >
                        <div className="font-medium text-sm mb-1">
                          Question {idx + 1}: {q.content}
                        </div>
                        <ul className="ml-4 list-disc text-xs">
                          {q.options.slice(0, 3).map((opt: any) => (
                            <li key={opt.id}>
                              <span className={opt.isCorrect ? 'text-green-700 font-medium' : ''}>
                                {opt.content} {opt.isCorrect && '(Correct)'}
                              </span>
                            </li>
                          ))}
                          {q.options.length > 3 && (
                            <li className="italic text-gray-500">
                              +{q.options.length - 3} more options...
                            </li>
                          )}
                        </ul>
                      </button>

                      {/* icons edit / delete question */}
                      <div className="flex flex-col gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => {
                            setSelectedQuestionId(null);
                            setQuestionContent(q.content || '');
                            setExplanation(q.explanation || '');
                            setEditingQuestionId(q.id);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-600"
                          onClick={async () => {
                            if (
                              !baseSelected?.courseId ||
                              !baseSelected?.moduleId ||
                              !baseSelected.lessonId
                            )
                              return;
                            const ok = window.confirm('Delete this question?');
                            if (!ok) return;

                            await dispatch(
                              deleteQuestionByLesson({
                                courseId: baseSelected.courseId!,
                                moduleId: baseSelected.moduleId!,
                                lessonId: baseSelected.lessonId!,
                                quizId: selectedQuizId!,
                                questionId: q.id,
                              }),
                            );

                            await loadPreviewForQuiz(selectedQuizId!);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
