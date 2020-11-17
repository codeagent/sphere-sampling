import { ChangeDetectionStrategy } from "@angular/compiler/src/core";
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output
} from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { SamplingLayerOptions, SamplingType } from "../types";

@Component({
  selector: "sampling-layer",
  templateUrl: "./sampling-layer.component.html",
  styleUrls: ["./sampling-layer.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SamplingLayerComponent implements OnInit, OnDestroy, OnChanges {
  @Input() layer: SamplingLayerOptions;
  @Input() disableRemove: boolean;
  @Output() layerChanged = new EventEmitter<SamplingLayerOptions>();
  @Output() layerRemoved = new EventEmitter();

  typeOptions = [
    { value: SamplingType.Random, label: "Random" },
    { value: SamplingType.Regular, label: "Regular" },
    { value: SamplingType.Icosphere, label: "Icosphere" }
  ];
  form = new FormGroup({
    type: new FormControl(),
    radius: new FormControl(),
    angle: new FormControl(),
    samples: new FormControl(),
    divisions: new FormControl(),
    displayRays: new FormControl(),
    displayDots: new FormControl(),
    displaySphere: new FormControl()
  });
  SamplingType = SamplingType;

  private destroy$ = new Subject();

  ngOnInit() {
    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((e: SamplingLayerOptions) =>
        this.layerChanged.next({ ...e, id: this.layer.id })
      );
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  ngOnChanges() {
    this.form.patchValue(this.layer, { emitEvent: false });
  }

  remove() {
    this.layerRemoved.emit();
  }
}
