import axios from 'axios';
import { useEffect, useState } from 'react';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import { CounterInfo } from '@/models/interface/counter';

const CounterCard = ({ count, label }: { count: number; label: string }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0,
  });

  return (
    <div className="p-6" ref={ref}>
      <h2 className="text-6xl font-bold mb-1">
        {inView && <CountUp start={0} end={count} duration={2} separator="," delay={0.5} />}
      </h2>
      <p className="font-extrabold pb-3">__________</p>
      <p className="text-white text-2xl">{label}</p>
    </div>
  );
};

const Counter = () => {
  const [counterInfo, setCounterInfo] = useState<CounterInfo[]>([]);

  useEffect(() => {
    axios.get('/data/CounterInfo/CounterInfo.json').then(res => {
      setCounterInfo(res.data.counterInfo || []);
    });
  }, []);

  return (
    <section className="py-16 bg-gradient-to-r from-purple-500 to bg-[#FFB6E0] text-white">
      <div className="max-w-7xl mx-auto gap-8 grid grid-cols-1 md:grid-cols-4 text-center">
        {Array.isArray(counterInfo) &&
          counterInfo.map(item => (
            <CounterCard key={item.id} count={item.count} label={item.label} />
          ))}
      </div>
    </section>
  );
};

export default Counter;
