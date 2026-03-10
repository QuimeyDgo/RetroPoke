/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, ChevronRight, Info, Map as MapIcon, ChevronLeft } from 'lucide-react';
import { GENERATIONS } from './constants';
import { Pokemon, GenerationInfo, EvolutionStep } from './types';

export default function App() {
  const [selectedGen, setSelectedGen] = useState<GenerationInfo>(GENERATIONS[0]);
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchPokemonForGen(selectedGen);
  }, [selectedGen]);

  const fetchPokemonForGen = async (gen: GenerationInfo) => {
    setLoading(true);
    try {
      const promises = Array.from({ length: 20 }, (_, i) => 
        fetch(`https://pokeapi.co/api/v2/pokemon/${gen.startId + i}`).then(res => res.json())
      );
      
      const results = await Promise.all(promises);
      
      const formattedPokemon: Pokemon[] = await Promise.all(results.map(async (data) => {
        const speciesRes = await fetch(data.species.url);
        const speciesData = await speciesRes.json();
        
        const description = speciesData.flavor_text_entries.find(
          (entry: any) => entry.language.name === 'es'
        )?.flavor_text || speciesData.flavor_text_entries.find(
          (entry: any) => entry.language.name === 'en'
        )?.flavor_text || "No hay descripción disponible.";

        // Fetch evolution chain
        const evoRes = await fetch(speciesData.evolution_chain.url);
        const evoData = await evoRes.json();
        const evolutionChain = parseEvolutionChain(evoData.chain);

        return {
          id: data.id,
          name: data.name,
          types: data.types.map((t: any) => t.type.name),
          sprite: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
          description: description.replace(/\f/g, ' '),
          height: data.height / 10, // decimeters to meters
          weight: data.weight / 10, // hectograms to kg
          evolutionChain
        };
      }));

      setPokemonList(formattedPokemon);
    } catch (error) {
      console.error("Error fetching pokemon:", error);
    } finally {
      setLoading(false);
    }
  };

  const parseEvolutionChain = (chain: any): EvolutionStep[] => {
    const steps: EvolutionStep[] = [];
    let current = chain;

    while (current) {
      const details = current.evolution_details[0];
      steps.push({
        name: current.species.name,
        minLevel: details?.min_level || null,
        item: details?.item?.name || null,
        trigger: details?.trigger?.name || 'none'
      });
      current = current.evolves_to[0];
    }
    return steps;
  };

  const openPokemonDetails = (pokemon: Pokemon) => {
    setSelectedPokemon(pokemon);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 z-0 transition-all duration-700 ease-in-out opacity-20 grayscale-50"
        style={{ 
          backgroundImage: `url(${selectedGen.mapUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="fixed inset-0 z-0 bg-white/40" />

      {/* Header */}
      <header className="relative z-10 bg-gb-darkest text-gb-lightest p-6 border-b-8 border-gb-dark shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-2xl md:text-4xl tracking-tighter uppercase font-bold text-center">PokéDex</h1>
            <div className="h-1 w-48 bg-gb-lightest" />
          </div>
          <nav className="flex flex-wrap justify-center gap-3">
            {GENERATIONS.map((gen) => (
              <button
                key={gen.id}
                onClick={() => setSelectedGen(gen)}
                className={`pixel-button ${
                  selectedGen.id === gen.id ? 'active' : ''
                }`}
              >
                GEN {gen.id}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Region Info Section */}
      <section className="relative z-10 max-w-7xl mx-auto w-full p-6 mt-4">
        <motion.div 
          key={selectedGen.region}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gb-lightest pixel-border p-6 mb-10"
        >
          <div className="flex items-center gap-3 mb-4 border-b-4 border-gb-darkest pb-2">
            <MapIcon className="w-6 h-6" />
            <h2 className="text-xl uppercase">{selectedGen.region} REGION</h2>
          </div>
          <p className="text-[10px] leading-loose mb-4">{selectedGen.description}</p>
          <div className="text-[8px] uppercase flex items-center gap-2 opacity-70">
            <Info className="w-3 h-3" />
            <span>Pokedex: 001 - 020</span>
          </div>
        </motion.div>

        {/* Pokemon Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-gb-darkest border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xs uppercase">Cargando...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {pokemonList.map((pokemon, index) => (
              <motion.div
                key={pokemon.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => openPokemonDetails(pokemon)}
                className="pokemon-card pixel-border p-4 cursor-pointer flex flex-col items-center group"
              >
                <div className="text-[8px] self-start mb-2 opacity-60">NO.{String(pokemon.id).padStart(3, '0')}</div>
                <div className="bg-gb-light p-2 border-2 border-gb-darkest mb-4 w-full flex justify-center">
                  <img 
                    src={pokemon.sprite} 
                    alt={pokemon.name} 
                    className="w-24 h-24 object-contain grayscale brightness-90 group-hover:grayscale-0 group-hover:brightness-100 transition-all"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h3 className="text-[10px] uppercase text-center font-bold mb-3">{pokemon.name}</h3>
                <div className="flex gap-1">
                  {pokemon.types.map(type => (
                    <span 
                      key={type} 
                      className="type-badge uppercase"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Pokemon Detail Modal */}
      <AnimatePresence>
        {isModalOpen && selectedPokemon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-gb-darkest/90"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 bg-gb-lightest pixel-border w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-1 hover:bg-gb-dark hover:text-gb-lightest border-2 border-gb-darkest"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left: Sprite */}
                  <div className="flex flex-col items-center md:w-1/2">
                    <div className="bg-gb-light pixel-border p-4 w-full flex justify-center mb-4">
                      <img 
                        src={selectedPokemon.sprite} 
                        alt={selectedPokemon.name} 
                        className="w-48 h-48 object-contain grayscale-0"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="w-full space-y-2">
                      <div className="flex justify-between text-[10px] border-b-2 border-gb-darkest pb-1">
                        <span>ALTURA</span>
                        <span>{selectedPokemon.height}m</span>
                      </div>
                      <div className="flex justify-between text-[10px] border-b-2 border-gb-darkest pb-1">
                        <span>PESO</span>
                        <span>{selectedPokemon.weight}kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Info */}
                  <div className="md:w-1/2 flex flex-col">
                    <div className="mb-4">
                      <span className="text-[8px] opacity-60">NO.{String(selectedPokemon.id).padStart(3, '0')}</span>
                      <h2 className="text-xl uppercase font-bold mb-2">{selectedPokemon.name}</h2>
                      <div className="flex gap-2">
                        {selectedPokemon.types.map(type => (
                          <span key={type} className="type-badge uppercase">{type}</span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gb-light p-3 border-2 border-gb-darkest mb-4">
                      <p className="text-[10px] leading-relaxed">
                        {selectedPokemon.description}
                      </p>
                    </div>

                    <div className="mt-auto">
                      <h4 className="text-[10px] font-bold mb-3 border-b-2 border-gb-darkest">EVOLUCION</h4>
                      <div className="flex flex-wrap items-center gap-2">
                        {selectedPokemon.evolutionChain.map((step, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className={`text-[8px] p-1 border-2 border-gb-darkest ${step.name === selectedPokemon.name ? 'bg-gb-dark text-gb-lightest' : 'bg-transparent'}`}>
                              {step.name}
                            </div>
                            {idx < selectedPokemon.evolutionChain.length - 1 && (
                              <ChevronRight className="w-3 h-3" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="relative z-10 mt-auto bg-black text-white p-4 text-center">
        <p className="text-[10px] uppercase tracking-widest">
          Desarrollado con pasión Poké <span className="cursor-blink">_</span>
        </p>
      </footer>
    </div>
  );
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    normal: 'bg-gray-400 text-white',
    fire: 'bg-red-500 text-white',
    water: 'bg-blue-500 text-white',
    electric: 'bg-yellow-400 text-black',
    grass: 'bg-green-500 text-white',
    ice: 'bg-cyan-300 text-black',
    fighting: 'bg-orange-700 text-white',
    poison: 'bg-purple-500 text-white',
    ground: 'bg-yellow-700 text-white',
    flying: 'bg-indigo-300 text-black',
    psychic: 'bg-pink-500 text-white',
    bug: 'bg-lime-600 text-white',
    rock: 'bg-stone-600 text-white',
    ghost: 'bg-violet-800 text-white',
    dragon: 'bg-indigo-700 text-white',
    dark: 'bg-zinc-800 text-white',
    steel: 'bg-slate-400 text-black',
    fairy: 'bg-pink-300 text-black',
  };
  return colors[type] || 'bg-gray-200 text-black';
}
