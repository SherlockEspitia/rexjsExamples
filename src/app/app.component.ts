import { Component, OnInit } from '@angular/core';
import { ObsService } from './obs.service';
import { Observable, interval, timer, fromEvent, of, pipe, concat, range, merge, empty, forkJoin, Subject, ConnectableObservable,from, ReplaySubject, BehaviorSubject } from 'rxjs';
import { map, filter, tap, mapTo, share, take, bufferTime, switchMap, scan, takeWhile, startWith, delay, concatMap, mergeMap, multicast, debounceTime } from 'rxjs/operators';
import {ajax} from 'rxjs/ajax'  

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title = 'rxjs';
  obs:any;

  constructor(public servi:ObsService){}

  ngOnInit(){
    this.obs = new Observable(function(observer: { next: (arg0: number) => void; complete: () => void; }){
      observer.next(1);
      observer.next(2);
      observer.next(3);
      setTimeout(()=>{
        observer.next(4);
        observer.complete();
      }, 1000);
    });

    const contador = interval(1000);
    const espera = timer(1000);
    const el:any = document.getElementById('elemento');
    const mouseMove = fromEvent(el, 'mousemove');

    mouseMove.subscribe( (e:any)=>{
      console.log(`Coords: (${e.clientX} , ${e.clientY})`);
      
    });

    contador.subscribe((n)=>{
      console.log('Segundo: '+ n);  
    });

    espera.subscribe((m)=>{
      console.log('Espera');      
    });

    const nums = of(1,2,3,4,5)
    const alCuadrado = pipe(
      filter((num: number)=> num%2 === 0),
      map((num:number)=> num*num)
    );
    const cuadrados = alCuadrado(nums);
    cuadrados.subscribe((v:Number)=>console.log(v));

    const clicks = fromEvent(document, 'click');
    const positions = clicks.pipe(
      tap(e=> console.log('Procesado: ' + e),
      err=>console.log(err),
      () => console.log('complete')      
      ),
    );
    positions.subscribe(pos => console.log(pos));

    const nObs = espera.pipe(
      tap(()=>console.log('TAP ON')),
      mapTo('Fin Observable')
    );
    
    const subs01= nObs.subscribe(val=> console.log(val));
    const subs02= nObs.subscribe(val=> console.log(val));

    const shareObs = nObs.pipe(share());
    console.log('Compartido');
    const subs03 = shareObs.subscribe(v=>console.log(v));
    
    const waiter = interval(1000).pipe(take(4));
    const rango = range(1,10);

    const result = concat(waiter, rango);
    result.subscribe(x=>console.log(x));

    const half = interval(500);
    const buff = half.pipe(bufferTime(2000));

    const s = buff.subscribe(
      val => console.log('Buffer: ' + val)      
    );

    fromEvent(document, 'click').pipe(switchMap(()=> interval(1000))).subscribe(console.log);
    
    this.other();

    const tene = forkJoin(
      of('hola'),
      of('Mundo').pipe(delay(500)),
      interval(1000).pipe(take(2))
    )
    tene.subscribe(val=>console.log(val));
    
    this.newOther();

    const source = of(2000, 1000, 3000);
    const obsCM= source.pipe(
      concatMap(v=>of(`Valor: ${v}`).pipe(delay(v)))
    );

    obsCM.subscribe(v=>console.log(v));

    this.mege();

    this.servi.getGithub('ctmil').subscribe((res:any)=>{
      console.log(res);      
    });
    
    this.newFn();

    this.fn2();
    
    this.fnScan();

    /* Subject*/
    const subj = new Subject<number>();

    subj.subscribe({
      next:(n)=>console.log(`ObsA: ${n}`)
    });
    subj.subscribe({
      next:(n)=>console.log(`ObsB: ${n + 1}`)      
    });

    subj.next(1);
    subj.next(2);

    this.multi();
    this.fnMl();

    this.fnReplay();

    this.beha();
    this.fnBehavior();

    this.fnDebounce();
  }
  
  rxjsFn(){
    console.log('Inicio suscripcion');
    this.obs.subscribe({
      next: (x: string) => console.log('La variable ' + x),
      error: (err:any)=> console.error('Si da error ' + err),
      complete:()=>console.log('Listo'),      
    });
    console.log('Luego de la suscripcion');    
  }

  other(){
    const remain:any= document.getElementById('remaining');
    const pButton:any = document.getElementById('pause');
    const rButton:any = document.getElementById('resume');

    const oInterval = interval(1000).pipe(mapTo(-1));
    const pause = fromEvent(pButton,'click').pipe(mapTo(false));
    const resume = fromEvent(rButton,'click').pipe(mapTo(true));

    const timer = merge(pause,resume)
      .pipe(
        startWith(true),
        switchMap(val=>(val ? oInterval: empty())),
        scan((acc, curr)=>(curr? curr + acc: acc), 10),
        takeWhile(v=> v>=0)
      ).subscribe((val:any)=>(remain.innerHTML = val))
  }

  newOther(){
    const src = forkJoin(
      {
        google: ajax.getJSON('https://api.github.com/users/google'),
        microsoft: ajax.getJSON('https://api.github.com/users/microsoft'),
        ctmil: ajax.getJSON('https://api.github.com/users/ctmil')
      }
    );
    src.subscribe(console.log);    
  }

  mege(){
    const source= of(
      ajax.getJSON('https://api.github.com/users/ctmil'),
      ajax.getJSON('https://api.github.com/users/ibuioli')
    );

    const obsMerge = source.pipe(
      mergeMap(v=> v)
    )

    obsMerge.subscribe(v=>console.log(v));
  }

  newFn(){//Multiple subscripcion en paralelo todas quedan en un vector
    forkJoin(this.servi.getGithub('ctmil'), this.servi.getGithub('angular'), this.servi.getGithub('odoo'))
    .subscribe( (res)=>{
      console.log(res);
    })
  }

  fn2(){// Multiple subscripcion en serie para encontrar valores en objetos complejos.
    this.servi.getGithub('ctmil').pipe(
      mergeMap((res:any)=>ajax(res.blog)),
    ).subscribe((final:any)=>{
      console.log(final.status);
    })
  }

  fnScan(){
    const src = of(1,2,3,4,5).pipe(delay(1000));
    const scanObs = src.pipe(scan((a,c)=>[...a, c],[0])); //encadenar http request
    scanObs.subscribe(val=>console.log(val))
  }

  multi(){
    const source = from ([1,2,3,4]);
    const ml= source.pipe(multicast(()=>new Subject())) as ConnectableObservable<any>;

    ml.subscribe({next:(v)=>console.log(`ObserverA: ${v}`)});
    ml.subscribe({next:(v)=>console.log(`ObserverB: ${v}`)});

    ml.connect();
  }
  fnMl(){
    const source = interval(3000).pipe(
      tap((n)=> console.log('ID:' + n))
    );

    const ml = source.pipe(multicast(()=>new Subject())) as ConnectableObservable<any>;

    ml.subscribe(v=> console.log('localhost:4200/' + (v)));
    ml.subscribe(v=> console.log('localhost:4200/' + (v -1)));

    ml.connect();
  }
  
  fnReplay(){
    const obs = new ReplaySubject(4);

    obs.next(1);
    obs.next(2);
    obs.next(3);
    obs.subscribe(console.log);
    obs.next(4);
    obs.next(5);
    obs.subscribe(console.log);

  }

  beha(){
    const subj = new BehaviorSubject(1);

    subj.subscribe(console.log);

    subj.next(2);

    subj.subscribe(console.log);
  }

  fnBehavior(){
    const sub = new BehaviorSubject(0);

    const click$= fromEvent(document, 'click').pipe(
      map((e:any)=>
      ({
        x:e.clientX,
        y:e.clientY
      }))
    )

    const interval$=interval(1000).pipe(
      tap(v=>sub.next(v))
    );

    merge(click$,interval$).subscribe(console.log);
  }

  fnDebounce(){
    const search:any = document.getElementById('search');
    const $keyup = fromEvent(search, 'keyup');

    $keyup.pipe(
      map((e:any)=> e.currentTarget.value),
      debounceTime(1000)
    ).subscribe(console.log);
  }
}
