export const STATIONS = [
 {name:'Trait Detective',subtitle:'Trait Discovery Island',icon:'🌺',xp:0,guardian:'Trait Guardian',mission:'Find the eggs hidden among the flowers. Discover which characteristics come from genes.',link:'A bird inherits genes influencing its feather color, but learns its song through experience.'},
 {name:'Family Generations',subtitle:'Family Generation Forest',icon:'🌳',xp:40,guardian:'Ancestry Guardian',mission:'Meet three generations of a family and trace their connections.',link:'Grandparents, parents, and children share family relationships across generations.'},
 {name:'Inheritance Tracker',subtitle:'Inheritance Tracking Jungle',icon:'🌿',xp:100,guardian:'Ancestry Guardian',mission:'Follow a simple trait through a family pedigree.',link:'Breeders and scientists use pedigrees to track inherited characteristics.'},
 {name:'Family Tree Challenge',subtitle:'Inheritance Village',icon:'🏡',xp:160,guardian:'Ancestry Guardian',mission:'Read the family map and interpret its symbols to collect the last forest eggs.',link:'A pedigree records relationships and the presence of a particular trait.'},
 {name:'Punnett Lab',subtitle:'Build the Square',icon:'🧪',xp:230,guardian:'Grid Guardian',mission:'Combine parent alleles to build three different offspring squares.',link:'Plant breeders use genetic crosses to explore possible offspring traits.'},
 {name:'Genotype & Phenotype Arena',subtitle:'Predict the Offspring',icon:'🔬',xp:300,guardian:'Grid Guardian',mission:'Count combinations and compare genotypes with expressed traits.',link:'Two organisms with different genotypes can show the same dominant phenotype.'},
 {name:'Ratio Arena',subtitle:'Breed and Predict',icon:'💎',xp:370,guardian:'Ratio Guardian',mission:'Simplify offspring ratios and turn box counts into percentages.',link:'Probabilities describe each offspring, not a guaranteed number in a family.'},
 {name:'Genetics Master Challenge',subtitle:'The Final Generation',icon:'🧬',xp:450,guardian:'Fusion Guardian',mission:'Choose matching parent pets and apply every skill to create a new companion.',link:'This pet-fusion reward is fictional. Real inheritance follows genetic probabilities, not puzzle accuracy.'}
];
const question=(prompt,options,answer,hint)=>({prompt,options,answer,hint});
export const EGG_QUESTIONS=[
 [question('Which is influenced by inherited genes?',['Natural feather color','Learning to ride a bicycle','A scar'],0,'Think about what parents pass on through genes.'),question('In the flower model, which pair expresses the recessive white trait?',['PP','Pp','pp'],2,'A recessive phenotype requires two recessive copies.'),question('A purple Pp flower receives its alleles from…',['Only its mother','One from each parent','Only its father'],1,'Each parent contributes genetic information.')],
 [question('Which family members belong in generation I?',['Children','Parents','Grandparents'],2,'Start with the oldest generation shown.'),question('Parents are generation II. Their children belong in…',['I','II','III'],2,'Move one generation forward.'),question('A line descending from a couple connects them to…',['Their offspring','Unrelated neighbors','Only male relatives'],0,'A descent line shows the next generation.')],
 [question('A shaded pedigree symbol indicates…',['Trait present','Trait absent','A learned skill'],0,'Use the shading legend.'),question('Can two Bb parents have a bb offspring?',['Yes','No','Only if the trait is acquired'],0,'Consider which allele each parent can contribute.'),question('A dominant-phenotype parent has a bb child. What must that parent carry?',['Only dominant alleles','A recessive allele as well','No alleles'],1,'The child receives one recessive allele from each parent.')],
 [question('In this pedigree, squares represent…',['Males','Females','Only grandparents'],0,'Shape and shading communicate different information.'),question('A circle with no shading represents…',['A female without the modeled trait','A male with the trait','An unrelated person'],0,'Read the shape and the shading separately.'),question('Can shading alone distinguish BB from Bb in a dominant-trait pedigree?',['Always','No','Only in generation III'],1,'Both genotypes can express the dominant trait.')]
];
export const ASSESSMENT=[
 question('An allele is…',['A version of a gene','A learned behavior','A generation'],0,''),
 question('Grandparents appear in which generation of a three-generation pedigree?',['I','II','III'],0,''),
 question('A shaded symbol in a pedigree means…',['Trait absent','Trait present','Older individual'],1,''),
 question('One allele for this modeled gene comes from…',['Each parent','Only one parent','A learned skill'],0,''),
 question('B combined with b is conventionally written…',['BB','bb','Bb'],2,''),
 question('For Bb × Bb, how many boxes are heterozygous?',['1','2','3'],1,''),
 question('For Bb × Bb, the dominant:recessive phenotype ratio is…',['1:2:1','3:1','1:3'],1,''),
 question('For BB × bb, the probability of Bb offspring is…',['25%','50%','100%'],2,'')
];
export const REVIEWS=[
 [['Prof. Gene','Welcome, explorer! DNA carries genetic information. Genes are sections of DNA, and chromosomes organize it.','🧬'],['Pip','Alleles are versions of a gene. Inherited traits are influenced by genes; cycling is learned through practice.','🦜'],['Prof. Gene','In our simple model, P is dominant and p is recessive. PP and Pp flowers are purple; pp flowers are white.','🌺']],
 [['Prof. Gene','A generation is a level in a family. We start with grandparents in generation I.','👵'],['Pip','Their children become the parents in generation II. The next children are generation III.','🌳'],['Prof. Gene','Partner lines connect a couple. Descent lines connect parents to offspring. Trace the family from top to bottom.','🔗']],
 [['Prof. Gene','A pedigree tracks a particular trait through generations. Shading means the modeled trait is present.','🌿'],['Pip','For this simple dominant trait, BB and Bb show green. Only bb shows yellow.','🦎'],['Prof. Gene','Offspring receive one allele from each parent. A recessive trait can reappear when both parents pass a recessive allele.','🧬']],
 [['Prof. Gene','Read the legend first: square for male, circle for female. Shading shows the modeled trait.','🏡'],['Pip','Look at one generation at a time, then follow the descent lines.','🌳'],['Prof. Gene','A dominant phenotype can be BB or Bb. You may need offspring information to infer a parent genotype.','🔎']],
 [['Prof. Gene','A Punnett square predicts possible offspring. Each parent contributes one allele to each combination.','🧪'],['Pip','For Bb × Bb, write B and b across the top and down the side. Combine the row and column alleles.','🧬'],['Prof. Gene','The four boxes are BB, Bb, Bb, bb. Write capital letters first. Our next crosses will use different parents.','🔬']],
 [['Prof. Gene','Genotype is an allele pair: BB, Bb, or bb. Phenotype is the expressed characteristic.','🔬'],['Pip','In our green/yellow model, BB and Bb are green (dominant); bb is yellow (recessive).','🟢'],['Prof. Gene','Count each genotype separately. Then combine BB and Bb when counting the dominant phenotype.','📊']],
 [['Prof. Gene','Write genotype ratios in BB:Bb:bb order. Divide every count by their greatest common factor.','💎'],['Pip','For Bb × Bb, the genotype ratio is 1:2:1. The phenotype ratio is 3:1.','📊'],['Prof. Gene','Each of four equally likely boxes represents 25%. Probabilities apply independently to each offspring.','🧮']],
 [['Prof. Gene','Choose two pets of the same species and level. Their genotypes set the cross you must solve.','🧬'],['Pip','Build the square, simplify the ratios, and calculate percentages. Parents stay safe until your final confirmation.','🥚'],['Prof. Gene','A correct final submission fuses the parents. Accuracy affects the game rarity reward, not real-world inheritance.','✨']]
];
export const RARITIES=['Common','Rare','Epic','Legendary','Prismatic'];
export const SPECIES=[['Chick','Turtle','Frog'],['Gecko','Snake','Butterfly'],['Owl','Duck','Penguin'],['Eagle','Crocodile','Macaw'],['Peacock','Parrot','Octopus']];
export const PET_ICONS={Chick:'🐣',Turtle:'🐢',Frog:'🐸',Gecko:'🦎',Lizard:'🦎',Macaw:'🦜',Snake:'🐍',Butterfly:'🦋',Owl:'🦉',Duck:'🦆',Penguin:'🐧',Eagle:'🦅',Crocodile:'🐊',Swan:'🦢',Peacock:'🦚',Parrot:'🦜',Octopus:'🐙'};
export const CROSSES=[['Bb','Bb'],['BB','bb'],['Bb','bb']];
export const HATCH_SECONDS=[20,40,60];
export function cross(a,b){
 const boxes=[...a].flatMap(x=>[...b].map(y=>[x,y].sort().join('')));
 const counts=['BB','Bb','bb'].map(g=>boxes.filter(x=>x===g).length);
 const gcd=(a,b)=>b?gcd(b,a%b):a;
 const simplify=values=>{const divisor=values.reduce(gcd,0)||1;return values.map(v=>v/divisor).join(':')};
 const dominant=counts[0]+counts[1];
 return {boxes,counts,genotype:simplify(counts),phenotype:simplify([dominant,counts[2]]),percent:counts.map(n=>n*25),dominant,dominantPercent:dominant*25,recessivePercent:counts[2]*25};
}
export function localDay(now=Date.now()){const d=new Date(now);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
export function yesterday(now=Date.now()){const d=new Date(now);d.setDate(d.getDate()-1);return localDay(d.getTime())}
