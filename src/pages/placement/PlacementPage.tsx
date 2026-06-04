import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ArrowRight,
  RefreshCcw,
  CheckCircle2,
  Sparkles,
  Target,
  BookOpen,
  Layers3,
} from 'lucide-react';

type Level = 'Beginner' | 'Intermediate' | 'Advanced';

type Option = {
  label: string;
  score: number;
};

type Question = {
  id: string;
  prompt: string;
  options: Option[];
};

type Category = {
  id: string;
  title: string;
  description: string;
  questions: Question[];
};

const CATEGORY_BANK: Category[] = [
  {
    id: 'applied-machine-learning',
    title: 'Applied Machine Learning',
    description: 'Applied ML models, training workflows, evaluation, and feature engineering.',
    questions: [
      {
        id: 'aml_1',
        prompt: 'In machine learning, which dataset should be used for final evaluation?',
        options: [
          { label: 'Test set', score: 2 },
          { label: 'Train set', score: 0 },
          { label: 'Feature set', score: 0 },
        ],
      },
      {
        id: 'aml_2',
        prompt: 'What is overfitting?',
        options: [
          {
            label: 'The model learns the training data too closely and generalizes poorly',
            score: 2,
          },
          { label: 'The model is trained for too few epochs', score: 0 },
          { label: 'The model has low accuracy on the training set', score: 0 },
        ],
      },
      {
        id: 'aml_3',
        prompt: 'Which technique is commonly used to improve generalization?',
        options: [
          { label: 'Cross-validation', score: 2 },
          { label: 'Delete the test set', score: 0 },
          { label: 'Train again on exactly 1 sample', score: 0 },
        ],
      },
      {
        id: 'aml_4',
        prompt:
          'In an imbalanced classification problem, which metric is often more useful than accuracy?',
        options: [
          { label: 'F1-score', score: 2 },
          { label: 'Epoch count', score: 0 },
          { label: 'Learning rate name', score: 0 },
        ],
      },
      {
        id: 'aml_5',
        prompt: 'What is the role of feature engineering?',
        options: [
          { label: 'Transform/select features so the model can learn better', score: 2 },
          { label: 'Only to make the data look nicer', score: 0 },
          { label: 'Completely replace the model', score: 0 },
        ],
      },
    ],
  },
  {
    id: 'big-data-engineering',
    title: 'Big Data Engineering',
    description:
      'Large-scale data processing, pipelines, batch/streaming, and distributed systems.',
    questions: [
      {
        id: 'bde_1',
        prompt: 'Which concept describes processing data in batches?',
        options: [
          { label: 'Batch processing', score: 2 },
          { label: 'Streaming UI', score: 0 },
          { label: 'Local styling', score: 0 },
        ],
      },
      {
        id: 'bde_2',
        prompt: 'What is Apache Spark commonly used for?',
        options: [
          { label: 'Large-scale distributed data processing', score: 2 },
          { label: 'Designing web interfaces', score: 0 },
          { label: 'Editing images', score: 0 },
        ],
      },
      {
        id: 'bde_3',
        prompt: 'What does ETL stand for?',
        options: [
          { label: 'Extract, Transform, Load', score: 2 },
          { label: 'Execute, Train, Learn', score: 0 },
          { label: 'Edit, Track, Log', score: 0 },
        ],
      },
      {
        id: 'bde_4',
        prompt: 'Kafka is typically suitable for which use case?',
        options: [
          { label: 'Streaming data / event pipeline', score: 2 },
          { label: 'Storing CSS', score: 0 },
          { label: 'Rendering icons', score: 0 },
        ],
      },
      {
        id: 'bde_5',
        prompt: 'How does partitioning help in big data systems?',
        options: [
          { label: 'Improves read/write efficiency and scales better', score: 2 },
          { label: 'Reduces the number of columns to 0', score: 0 },
          { label: 'Deletes metadata', score: 0 },
        ],
      },
    ],
  },
  {
    id: 'computer-vision',
    title: 'Computer Vision',
    description: 'Image processing, CNNs, object detection, and image classification.',
    questions: [
      {
        id: 'cv_1',
        prompt: 'CNNs are commonly used for which type of problem?',
        options: [
          { label: 'Image processing', score: 2 },
          { label: 'Text editing', score: 0 },
          { label: 'Renaming variables', score: 0 },
        ],
      },
      {
        id: 'cv_2',
        prompt: 'What is image classification?',
        options: [
          { label: 'Classifying an entire image into one or more classes', score: 2 },
          { label: 'Finding nice colors for an interface', score: 0 },
          { label: 'Compressing an image file into zip', score: 0 },
        ],
      },
      {
        id: 'cv_3',
        prompt: 'How is object detection different from classification?',
        options: [
          { label: 'Detection both classifies and locates objects', score: 2 },
          { label: 'Detection only resizes images', score: 0 },
          { label: 'Detection is unrelated to image data', score: 0 },
        ],
      },
      {
        id: 'cv_4',
        prompt: 'How does data augmentation help in computer vision?',
        options: [
          { label: 'Increases the diversity of training data', score: 2 },
          { label: 'Completely removes the test data', score: 0 },
          { label: 'Replaces the GPU with a CPU', score: 0 },
        ],
      },
      {
        id: 'cv_5',
        prompt: 'IoU is commonly used in which context?',
        options: [
          { label: 'Evaluating bounding boxes in detection', score: 2 },
          { label: 'Measuring button render speed', score: 0 },
          { label: 'Measuring the number of variables', score: 0 },
        ],
      },
    ],
  },
  {
    id: 'data-mining',
    title: 'Data Mining',
    description: 'Data mining, pattern discovery, clustering, and association rules.',
    questions: [
      {
        id: 'dm_1',
        prompt: 'What is the main goal of data mining?',
        options: [
          { label: 'Find useful patterns/insights from data', score: 2 },
          { label: 'Only store data for appearance', score: 0 },
          { label: 'Replace the database', score: 0 },
        ],
      },
      {
        id: 'dm_2',
        prompt: 'Which algorithm is commonly used for clustering?',
        options: [
          { label: 'K-means', score: 2 },
          { label: 'Linear CSS', score: 0 },
          { label: 'DOM tree', score: 0 },
        ],
      },
      {
        id: 'dm_3',
        prompt: 'Association rule mining is often associated with which example?',
        options: [
          { label: 'Market basket analysis', score: 2 },
          { label: 'Designing a landing page', score: 0 },
          { label: 'Cropping a portrait photo', score: 0 },
        ],
      },
      {
        id: 'dm_4',
        prompt: 'What does support represent in association rules?',
        options: [
          { label: 'The frequency of an itemset appearing', score: 2 },
          { label: 'The number of lines of code', score: 0 },
          { label: 'The brightness of an image', score: 0 },
        ],
      },
      {
        id: 'dm_5',
        prompt: 'Clustering belongs to which type of learning?',
        options: [
          { label: 'Unsupervised learning', score: 2 },
          { label: 'Supervised learning', score: 0 },
          { label: 'Reinforcement only', score: 0 },
        ],
      },
    ],
  },
  {
    id: 'frontend-programming',
    title: 'Frontend Programming',
    description: 'HTML, CSS, JavaScript, UI, components, and responsiveness.',
    questions: [
      {
        id: 'fe_1',
        prompt: 'HTML: which tag is used to create a link?',
        options: [
          { label: '<a>', score: 2 },
          { label: '<link>', score: 1 },
          { label: '<href>', score: 0 },
        ],
      },
      {
        id: 'fe_2',
        prompt: 'CSS: which property changes the text color?',
        options: [
          { label: 'color', score: 2 },
          { label: 'font-color', score: 0 },
          { label: 'text-color', score: 0 },
        ],
      },
      {
        id: 'fe_3',
        prompt: 'JavaScript: which method is used to iterate through each array element?',
        options: [
          { label: 'map()', score: 2 },
          { label: 'style()', score: 0 },
          { label: 'pushAll()', score: 0 },
        ],
      },
      {
        id: 'fe_4',
        prompt: 'What is commonly used for responsive design?',
        options: [
          { label: 'Media queries', score: 2 },
          { label: 'Console logs', score: 0 },
          { label: 'Inline styles only', score: 0 },
        ],
      },
      {
        id: 'fe_5',
        prompt: 'In React, what is the purpose of a component?',
        options: [
          { label: 'Break the UI into reusable parts', score: 2 },
          { label: 'Increase image size', score: 0 },
          { label: 'Replace the backend database', score: 0 },
        ],
      },
    ],
  },
  {
    id: 'java-programming',
    title: 'Java Programming',
    description: 'Java core, OOP, collections, exceptions, classes, and objects.',
    questions: [
      {
        id: 'java_1',
        prompt: 'What type of language is Java?',
        options: [
          { label: 'Object-oriented programming language', score: 2 },
          { label: 'Only used to write CSS', score: 0 },
          { label: 'Markup language', score: 0 },
        ],
      },
      {
        id: 'java_2',
        prompt: 'Which keyword is used to create a new object in Java?',
        options: [
          { label: 'new', score: 2 },
          { label: 'create', score: 0 },
          { label: 'object', score: 0 },
        ],
      },
      {
        id: 'java_3',
        prompt: 'Which collection stores elements as key-value pairs?',
        options: [
          { label: 'Map', score: 2 },
          { label: 'List', score: 0 },
          { label: 'Set', score: 0 },
        ],
      },
      {
        id: 'java_4',
        prompt: 'What is try-catch used for?',
        options: [
          { label: 'Handling exceptions', score: 2 },
          { label: 'Creating loops', score: 0 },
          { label: 'Declaring a class', score: 0 },
        ],
      },
      {
        id: 'java_5',
        prompt: 'Encapsulation in OOP is usually associated with what?',
        options: [
          { label: 'Hiding data and accessing it through methods', score: 2 },
          { label: 'Allowing direct modification of all variables', score: 0 },
          { label: 'Removing the constructor', score: 0 },
        ],
      },
    ],
  },
  {
    id: 'machine-learning-mastery',
    title: 'Machine Learning Mastery',
    description:
      'More advanced machine learning: model selection, bias-variance, tuning, and pipelines.',
    questions: [
      {
        id: 'mlm_1',
        prompt: 'What does the bias-variance tradeoff describe?',
        options: [
          { label: 'The balance between model simplicity and generalization', score: 2 },
          { label: 'The color of the dashboard', score: 0 },
          { label: 'The name of the data file', score: 0 },
        ],
      },
      {
        id: 'mlm_2',
        prompt: 'What is the purpose of hyperparameter tuning?',
        options: [
          { label: 'Optimize model settings for better performance', score: 2 },
          { label: 'Rename features', score: 0 },
          { label: 'Delete the validation set', score: 0 },
        ],
      },
      {
        id: 'mlm_3',
        prompt: 'How does a pipeline help in ML?',
        options: [
          { label: 'Standardizes preprocess + train + predict steps', score: 2 },
          { label: 'Creates multiple browser windows', score: 0 },
          { label: 'Completely replaces metrics', score: 0 },
        ],
      },
      {
        id: 'mlm_4',
        prompt: 'What is grid search commonly used for?',
        options: [
          { label: 'Finding a suitable combination of hyperparameters', score: 2 },
          { label: 'Designing a grid UI', score: 0 },
          { label: 'Compressing the model', score: 0 },
        ],
      },
      {
        id: 'mlm_5',
        prompt:
          'When the validation score is very high but the test score is low, what might be happening?',
        options: [
          {
            label:
              'The model does not generalize well / may be overfitting to the validation strategy',
            score: 2,
          },
          { label: 'The model is definitely perfect', score: 0 },
          { label: 'There is no need for a test set anymore', score: 0 },
        ],
      },
    ],
  },
  {
    id: 'music-123',
    title: 'Music 123',
    description: 'Basic music theory, rhythm, notes, chords, and beginner ear training.',
    questions: [
      {
        id: 'm123_1',
        prompt: 'In basic music theory, which note comes after Do?',
        options: [
          { label: 'Re', score: 2 },
          { label: 'La', score: 0 },
          { label: 'Si', score: 0 },
        ],
      },
      {
        id: 'm123_2',
        prompt: 'What is 4/4 time commonly understood as?',
        options: [
          { label: 'Each measure has 4 beats, and each beat is a quarter note', score: 2 },
          { label: 'There are 4 songs in 1 album', score: 0 },
          { label: 'An instrument with 4 strings', score: 0 },
        ],
      },
      {
        id: 'm123_3',
        prompt: 'What is a chord?',
        options: [
          { label: 'A group of multiple notes played at the same time', score: 2 },
          { label: 'A type of microphone', score: 0 },
          { label: 'The name of a rhythm', score: 0 },
        ],
      },
      {
        id: 'm123_4',
        prompt: 'What does the # symbol usually mean in music?',
        options: [
          { label: 'Sharp', score: 2 },
          { label: 'Flat', score: 0 },
          { label: 'Rest', score: 0 },
        ],
      },
      {
        id: 'm123_5',
        prompt: 'How do good listening skills help in learning music?',
        options: [
          { label: 'They help distinguish pitch, rhythm, and harmony better', score: 2 },
          { label: 'They help write code faster', score: 0 },
          { label: 'They increase FPS', score: 0 },
        ],
      },
    ],
  },
  {
    id: 'programming',
    title: 'Programming',
    description:
      'General programming logic, variables, functions, loops, conditions, and data structures.',
    questions: [
      {
        id: 'prog_1',
        prompt: 'What is a variable used for in programming?',
        options: [
          { label: 'Store data for reuse', score: 2 },
          { label: 'Only to decorate code', score: 0 },
          { label: 'Completely replace functions', score: 0 },
        ],
      },
      {
        id: 'prog_2',
        prompt: 'When is an if statement used?',
        options: [
          { label: 'When branching based on a condition is needed', score: 2 },
          { label: 'When importing a CSS file is needed', score: 0 },
          { label: 'When creating an image is needed', score: 0 },
        ],
      },
      {
        id: 'prog_3',
        prompt: 'What is a for loop commonly used for?',
        options: [
          { label: 'Repeating over multiple steps/elements', score: 2 },
          { label: 'Declaring a class', score: 0 },
          { label: 'Creating a database', score: 0 },
        ],
      },
      {
        id: 'prog_4',
        prompt: 'What is the benefit of a function?',
        options: [
          { label: 'Reuse logic', score: 2 },
          { label: 'It must make code longer', score: 0 },
          { label: 'It is unrelated to output', score: 0 },
        ],
      },
      {
        id: 'prog_5',
        prompt: 'What is an array commonly used for?',
        options: [
          { label: 'Store a list of multiple elements', score: 2 },
          { label: 'Store exactly 1 value only', score: 0 },
          { label: 'Only used for images', score: 0 },
        ],
      },
    ],
  },
  {
    id: 'python-programming-for-ai',
    title: 'Python Programming for AI',
    description: 'Python for AI: NumPy, pandas, functions, loops, and basic data handling.',
    questions: [
      {
        id: 'pyai_1',
        prompt: 'Why is Python commonly used in AI?',
        options: [
          { label: 'Readable syntax and a strong library ecosystem', score: 2 },
          { label: 'Only because the logo colors look nice', score: 0 },
          { label: 'No libraries are needed', score: 0 },
        ],
      },
      {
        id: 'pyai_2',
        prompt: 'Which library is commonly used for numerical array processing in Python?',
        options: [
          { label: 'NumPy', score: 2 },
          { label: 'Spring', score: 0 },
          { label: 'Tailwind', score: 0 },
        ],
      },
      {
        id: 'pyai_3',
        prompt: 'What is pandas mainly used for?',
        options: [
          { label: 'Processing and analyzing tabular data', score: 2 },
          { label: 'Making 3D games', score: 0 },
          { label: 'Creating CSS animations', score: 0 },
        ],
      },
      {
        id: 'pyai_4',
        prompt: 'How does list comprehension help in Python?',
        options: [
          { label: 'Write shorter logic for creating a new list', score: 2 },
          { label: 'Delete the entire list', score: 0 },
          { label: 'Replace imports', score: 0 },
        ],
      },
      {
        id: 'pyai_5',
        prompt: 'In Python, what is def used for?',
        options: [
          { label: 'Define a function', score: 2 },
          { label: 'Declare a classpath', score: 0 },
          { label: 'Run SQL', score: 0 },
        ],
      },
    ],
  },
];

function calcLevel(totalScore: number, maxScore: number): Level {
  const percent = Math.round((totalScore / maxScore) * 100);
  if (percent < 40) return 'Beginner';
  if (percent < 75) return 'Intermediate';
  return 'Advanced';
}

function getBadgeClasses(level: Level) {
  if (level === 'Beginner') return 'bg-rose-100 text-rose-700 ring-rose-200';
  if (level === 'Intermediate') return 'bg-amber-100 text-amber-700 ring-amber-200';
  return 'bg-emerald-100 text-emerald-700 ring-emerald-200';
}

export default function PlacementPage() {
  const navigate = useNavigate();

  const [step, setStep] = React.useState<'choose-category' | 'test' | 'result'>('choose-category');
  const [selectedCategory, setSelectedCategory] = React.useState<Category | null>(null);
  const [index, setIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, number>>({});

  const currentQuestion = selectedCategory?.questions[index] ?? null;
  const totalQuestions = selectedCategory?.questions.length ?? 0;
  const progress = totalQuestions > 0 ? Math.round((index / totalQuestions) * 100) : 0;

  const totalScore = selectedCategory
    ? selectedCategory.questions.reduce((sum, q) => sum + (answers[q.id] || 0), 0)
    : 0;

  const maxScore = selectedCategory ? selectedCategory.questions.length * 2 : 0;
  const level = maxScore > 0 ? calcLevel(totalScore, maxScore) : 'Beginner';

  const handleChooseCategory = (category: Category) => {
    setSelectedCategory(category);
    setAnswers({});
    setIndex(0);
    setStep('test');
  };

  const handlePickAnswer = (score: number) => {
    if (!currentQuestion) return;

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: score,
    }));

    const next = index + 1;
    if (selectedCategory && next >= selectedCategory.questions.length) {
      setStep('result');
    } else {
      setIndex(next);
    }
  };

  const restartAll = () => {
    setSelectedCategory(null);
    setAnswers({});
    setIndex(0);
    setStep('choose-category');
    localStorage.removeItem('placement_selected_category');
    localStorage.removeItem('placement_result');
    localStorage.removeItem('placement_done');
  };

  const saveAndGoRoadmap = () => {
    if (!selectedCategory) return;

    const payload = {
      categoryId: selectedCategory.id,
      categoryTitle: selectedCategory.title,
      score: totalScore,
      maxScore,
      level,
      answers,
    };

    localStorage.setItem('placement_selected_category', selectedCategory.id);
    localStorage.setItem('placement_result', JSON.stringify(payload));
    localStorage.setItem('placement_done', '1');

    navigate('/roadmap');
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <ChevronLeft size={18} />
            Back to Home
          </button>

          {step === 'test' && selectedCategory && (
            <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
              {selectedCategory.title} · {progress}%
            </div>
          )}
        </div>

        {step === 'choose-category' && (
          <div className="space-y-6">
            <div className="rounded-[28px] bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.06)] ring-1 ring-slate-200 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1.5 text-sm font-semibold text-sky-700 ring-1 ring-sky-200">
                <Sparkles size={16} />
                Category Placement
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Choose the category you want to evaluate first
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Users will choose the exact category they want to take the test in, then the system
                will provide a dedicated question set for that category. This matches the flow you
                described much better.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {CATEGORY_BANK.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleChooseCategory(category)}
                  className="rounded-[24px] bg-white p-5 text-left shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-slate-200 transition hover:-translate-y-1 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 ring-1 ring-slate-200">
                      <Layers3 size={18} />
                    </div>

                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {category.questions.length} questions
                    </div>
                  </div>

                  <div className="mt-4 text-xl font-semibold tracking-tight text-slate-900">
                    {category.title}
                  </div>

                  <div className="mt-2 text-sm leading-6 text-slate-500">
                    {category.description}
                  </div>

                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    Start assessment
                    <ArrowRight size={16} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'test' && selectedCategory && currentQuestion && (
          <div className="rounded-[28px] bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.06)] ring-1 ring-slate-200 sm:p-8">
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>
                  Question {index + 1}/{totalQuestions}
                </span>
                <span>{selectedCategory.title}</span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-900 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
              <Target size={16} />
              {selectedCategory.title}
            </div>

            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              {currentQuestion.prompt}
            </h2>

            <div className="mt-6 grid gap-3">
              {currentQuestion.options.map((option, optionIndex) => (
                <button
                  key={optionIndex}
                  onClick={() => handlePickAnswer(option.score)}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="font-medium text-slate-800">{option.label}</div>
                    <div className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                      select
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => {
                  if (index === 0) {
                    setStep('choose-category');
                    setSelectedCategory(null);
                    return;
                  }
                  setIndex(prev => Math.max(0, prev - 1));
                }}
                className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                ← Back
              </button>

              <div className="text-sm text-slate-500">Answer based on what you truly know.</div>
            </div>
          </div>
        )}

        {step === 'result' && selectedCategory && (
          <div className="space-y-6">
            <div className="rounded-[28px] bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.06)] ring-1 ring-slate-200 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
                <CheckCircle2 size={16} />
                Assessment Result
              </div>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                {selectedCategory.title}
              </h2>

              <p className="mt-3 text-slate-600">
                Your score is <b>{totalScore}</b>/<b>{maxScore}</b>.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div
                  className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 ${getBadgeClasses(level)}`}
                >
                  {level}
                </div>

                <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200">
                  {Math.round((totalScore / maxScore) * 100)}%
                </div>
              </div>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-900"
                  style={{ width: `${Math.round((totalScore / maxScore) * 100)}%` }}
                />
              </div>
            </div>

            <div className="rounded-[28px] bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.06)] ring-1 ring-slate-200 sm:p-8">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Suggestions
              </div>

              <div className="mt-4 rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
                <div className="flex items-start gap-3">
                  <BookOpen className="mt-0.5 text-slate-500" size={18} />
                  <div className="text-sm leading-7 text-slate-600">
                    {level === 'Beginner' &&
                      'You should start with the fundamentals of this category, learn each part step by step, and build mini projects early.'}
                    {level === 'Intermediate' &&
                      'You already have a fairly solid foundation. You should continue with a roadmap that strengthens your knowledge and adds more hands-on practice.'}
                    {level === 'Advanced' &&
                      'You are already quite strong in this category. The roadmap should prioritize real-world problems, optimization, and larger projects.'}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={restartAll}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-4 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <RefreshCcw size={18} />
                  Choose another category
                </button>

                <button
                  onClick={saveAndGoRoadmap}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 font-semibold text-white transition hover:bg-slate-800"
                >
                  Go to roadmap
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
