'use client';

import { useState } from 'react';
import { Plus, Trash2, CheckCircle, Circle, Save, Loader2 } from 'lucide-react';
import { addQuestion, deleteQuestion, addOption, deleteOption, setCorrectOption, createQuizForLesson } from './quiz-actions';
import { useRouter } from 'next/navigation';

interface QuizBuilderProps {
    lessonId: string;
    courseId: string;
    existingQuiz: any; // Type strictly later
}

export default function QuizBuilder({ lessonId, courseId, existingQuiz }: QuizBuilderProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [newQuestionText, setNewQuestionText] = useState('');

    const handleCreateQuiz = async () => {
        setIsLoading(true);
        try {
            await createQuizForLesson(lessonId, courseId, `Cuestionario de Lección`);
            router.refresh();
        } catch (error: any) {
            alert(`Error al crear cuestionario: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddQuestion = async () => {
        if (!newQuestionText.trim()) return;
        setIsLoading(true);
        try {
            await addQuestion(existingQuiz.id, newQuestionText);
            setNewQuestionText('');
            router.refresh(); // Basic revalidation
        } catch (error) {
            alert('Error adding question');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteQuestion = async (id: string) => {
        if (!confirm('Borrar pregunta?')) return;
        await deleteQuestion(id);
        router.refresh();
    };

    const handleAddOption = async (questionId: string, text: string) => {
        await addOption(questionId, text, false);
        router.refresh();
    };

    const handleDeleteOption = async (id: string) => {
        await deleteOption(id);
        router.refresh();
    };

    const handleSetCorrect = async (questionId: string, optionId: string) => {
        await setCorrectOption(questionId, optionId);
        router.refresh();
    };

    if (!existingQuiz) {
        return (
            <div className="text-center p-8 border-2 border-dashed rounded-xl">
                <p className="text-muted-foreground mb-4">Esta lección no tiene cuestionario.</p>
                <button
                    onClick={handleCreateQuiz}
                    disabled={isLoading}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium flex items-center gap-2 mx-auto"
                >
                    {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    Crear Cuestionario
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg">
                <h3 className="font-bold text-lg">Editor de Cuestionario</h3>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full border border-green-200">
                    Guardado Automático
                </span>
            </div>

            <div className="space-y-6">
                {existingQuiz.questions && existingQuiz.questions.map((q: any, idx: number) => (
                    <div key={q.id} className="border rounded-xl p-4 bg-card relative group">
                        <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>

                        <h4 className="font-medium mb-4 flex gap-2">
                            <span className="text-muted-foreground">{idx + 1}.</span>
                            {q.question_text}
                        </h4>

                        <div className="space-y-2 pl-4 border-l-2 border-border/50 ml-1">
                            {q.options && q.options.map((opt: any) => (
                                <div key={opt.id} className="flex items-center gap-3 group/opt">
                                    <button
                                        onClick={() => handleSetCorrect(q.id, opt.id)}
                                        className={`transition-colors ${opt.is_correct ? 'text-green-500' : 'text-muted-foreground hover:text-gray-400'}`}
                                        title={opt.is_correct ? "Respuesta Correcta" : "Marcar como correcta"}
                                    >
                                        {opt.is_correct ? <CheckCircle className="h-5 w-5 fill-green-100" /> : <Circle className="h-5 w-5" />}
                                    </button>
                                    <span className={opt.is_correct ? 'font-medium text-green-900 dark:text-green-100' : ''}>
                                        {opt.option_text}
                                    </span>
                                    <button
                                        onClick={() => handleDeleteOption(opt.id)}
                                        className="text-muted-foreground hover:text-red-500 opacity-0 group-hover/opt:opacity-100 transition-opacity ml-auto"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const form = e.target as HTMLFormElement;
                                    const input = form.elements.namedItem('optText') as HTMLInputElement;
                                    if (input.value.trim()) {
                                        handleAddOption(q.id, input.value);
                                        input.value = '';
                                    }
                                }}
                                className="flex gap-2 mt-2"
                            >
                                <input
                                    name="optText"
                                    placeholder="Agregar opción..."
                                    className="flex-1 bg-transparent border-b border-border text-sm focus:outline-none focus:border-primary py-1"
                                />
                                <button type="submit" className="text-primary hover:bg-primary/10 p-1 rounded">
                                    <Plus className="h-4 w-4" />
                                </button>
                            </form>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 border-2 border-dashed rounded-xl bg-muted/10">
                <label className="block text-sm font-medium mb-2">Nueva Pregunta</label>
                <div className="flex gap-2">
                    <input
                        value={newQuestionText}
                        onChange={(e) => setNewQuestionText(e.target.value)}
                        placeholder="Escribe la pregunta aquí..."
                        className="flex-1 p-2 rounded-md border bg-background"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddQuestion();
                        }}
                    />
                    <button
                        onClick={handleAddQuestion}
                        disabled={!newQuestionText.trim() || isLoading}
                        className="bg-zinc-900 text-white px-4 py-2 rounded-md hover:bg-zinc-800 disabled:opacity-50"
                    >
                        Agregar
                    </button>
                </div>
            </div>
        </div>
    );
}
