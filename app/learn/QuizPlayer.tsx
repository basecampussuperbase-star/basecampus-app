'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, ArrowRight, RefreshCw, Award } from 'lucide-react';
import { submitQuizAttempt } from '@/app/dashboard/courses/quiz-actions';
import { useRouter } from 'next/navigation';

interface Option {
    id: string;
    option_text: string;
    is_correct: boolean;
}

interface Question {
    id: string;
    question_text: string;
    options: Option[];
}

interface Quiz {
    id: string;
    title: string;
    passing_score: number;
    questions: Question[];
}

interface QuizPlayerProps {
    quiz: Quiz;
}

export default function QuizPlayer({ quiz }: QuizPlayerProps) {
    const router = useRouter();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({}); // valid questionId -> optionId
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [passed, setPassed] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const totalQuestions = quiz.questions.length;

    const handleOptionSelect = (optionId: string) => {
        if (isSubmitted) return;
        setSelectedAnswers({
            ...selectedAnswers,
            [currentQuestion.id]: optionId
        });
    };

    const handleNext = () => {
        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);

        // Calculate Score
        let correctCount = 0;
        quiz.questions.forEach(q => {
            const selectedOptionId = selectedAnswers[q.id];
            const correctOption = q.options.find(opt => opt.is_correct);
            if (correctOption && correctOption.id === selectedOptionId) {
                correctCount++;
            }
        });

        const finalScore = Math.round((correctCount / totalQuestions) * 100);
        const isPassed = finalScore >= (quiz.passing_score || 80);

        setScore(finalScore);
        setPassed(isPassed);

        try {
            await submitQuizAttempt(quiz.id, finalScore, isPassed, selectedAnswers);
            setIsSubmitted(true);
            router.refresh();
        } catch (error) {
            alert('Error al enviar el cuestionario. Por favor intenta de nuevo.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRetry = () => {
        setSelectedAnswers({});
        setCurrentQuestionIndex(0);
        setIsSubmitted(false);
        setScore(0);
        setPassed(false);
    };

    if (isSubmitted) {
        return (
            <div className="bg-card border rounded-xl p-8 text-center space-y-6 animate-in fade-in zoom-in-95">
                <div className="flex justify-center">
                    {passed ? (
                        <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                            <Award className="h-10 w-10" />
                        </div>
                    ) : (
                        <div className="h-20 w-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                            <XCircle className="h-10 w-10" />
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold">{passed ? '¡Felicidades! Aprobaste' : 'Sigue Intentando'}</h2>
                    <p className="text-muted-foreground text-lg">
                        Tu calificación: <span className={passed ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{score}%</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Necesitas {quiz.passing_score}% para aprobar.
                    </p>
                </div>

                <div className="pt-4">
                    {!passed ? (
                        <button
                            onClick={handleRetry}
                            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors"
                        >
                            <RefreshCw className="h-4 w-4" /> Intentar de Nuevo
                        </button>
                    ) : (
                        <div className="p-4 bg-green-50 text-green-800 rounded-lg text-sm">
                            Haz completado esta lección exitosamente. ¡Continúa con la siguiente!
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Checking if quiz has questions
    if (!quiz.questions || quiz.questions.length === 0) {
        return <div className="p-4 border rounded-lg text-muted-foreground italic">Este cuestionario aún no tiene preguntas.</div>;
    }

    return (
        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="bg-muted/30 p-4 border-b flex justify-between items-center">
                <h3 className="font-semibold flex items-center gap-2">
                    <div className="bg-primary/10 text-primary p-1 rounded">
                        <CheckCircle className="h-4 w-4" />
                    </div>
                    {quiz.title}
                </h3>
                <span className="text-xs font-medium text-muted-foreground bg-background px-2 py-1 rounded border">
                    Pregunta {currentQuestionIndex + 1} de {totalQuestions}
                </span>
            </div>

            {/* Question Body */}
            <div className="p-6 md:p-8 space-y-6">
                <h4 className="text-lg font-medium leading-relaxed">
                    {currentQuestion.question_text}
                </h4>

                <div className="space-y-3">
                    {currentQuestion.options.map((option) => {
                        const isSelected = selectedAnswers[currentQuestion.id] === option.id;
                        return (
                            <button
                                key={option.id}
                                onClick={() => handleOptionSelect(option.id)}
                                className={`w-full text-left p-4 rounded-lg border transition-all ${isSelected
                                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                        : 'border-border hover:bg-muted/50 hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-primary' : 'border-muted-foreground'
                                        }`}>
                                        {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                                    </div>
                                    <span className={isSelected ? 'font-medium text-foreground' : 'text-foreground'}>
                                        {option.option_text}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-muted/10 flex justify-end">
                <button
                    onClick={handleNext}
                    disabled={!selectedAnswers[currentQuestion.id] || submitting}
                    className="flex items-center gap-2 bg-zinc-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {submitting ? 'Enviando...' : (currentQuestionIndex === totalQuestions - 1 ? 'Finalizar' : 'Siguiente')}
                    {!submitting && <ArrowRight className="h-4 w-4" />}
                </button>
            </div>
        </div>
    );
}
