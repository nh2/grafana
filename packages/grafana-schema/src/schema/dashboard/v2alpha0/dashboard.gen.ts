// Code generated - EDITING IS FUTILE. DO NOT EDIT.

import { VariableOption, VariableRefresh, VariableSort, VariableType } from "../../../index.gen";

export interface DashboardV2 {
  kind: "Dashboard";
  spec: DashboardSpec;
}

export const defaultDashboardV2 = (): DashboardV2 => ({
  kind: "Dashboard",
  spec: defaultDashboardSpec(),
});

export interface DashboardSpec {
  // Unique numeric identifier for the dashboard.
  // `id` is internal to a specific Grafana instance. `uid` should be used to identify a dashboard across Grafana instances.
  id?: number;
  // Title of dashboard.
  title?: string;
  // Description of dashboard.
  description?: string;
  // Configuration of dashboard cursor sync behavior.
  // Accepted values are 0 (sync turned off), 1 (shared crosshair), 2 (shared crosshair and tooltip).
  cursorSync?: DashboardCursorSync;
  // When set to true, the dashboard will redraw panels at an interval matching the pixel width.
  // This will keep data "moving left" regardless of the query refresh rate. This setting helps
  // avoid dashboards presenting stale live data.
  liveNow?: boolean;
  // When set to true, the dashboard will load all panels in the dashboard when it's loaded.
  preload: boolean;
  // Whether a dashboard is editable or not.
  editable?: boolean;
  // Links with references to other dashboards or external websites.
  links: DashboardLink[];
  // Tags associated with dashboard.
  tags?: string[];
  timeSettings: TimeSettingsSpec;
  // Configured template variables.
  variables: Array<QueryVariableKind | TextVariableKind>;
  // |* more element types in the future
  elements: Record<string, PanelKind>;
  annotations: AnnotationQueryKind[];
  // revision?: int // for plugins only
  // gnetId?: string // ??? Wat is this used for?
  layout: GridLayoutKind;
}

export const defaultDashboardSpec = (): DashboardSpec => ({
  cursorSync: DashboardCursorSync.Off,
  liveNow: false,
  preload: false,
  editable: true,
  links: [],
  timeSettings: defaultTimeSettingsSpec(),
  variables: [],
  elements: {},
  annotations: [],
  layout: defaultGridLayoutKind(),
});

export interface AnnotationPanelFilter {
  // Should the specified panels be included or excluded
  exclude?: boolean;
  // Panel IDs that should be included or excluded
  ids: number[];
}

export const defaultAnnotationPanelFilter = (): AnnotationPanelFilter => ({
  exclude: false,
  ids: [],
});

// 0 for no shared crosshair or tooltip (default).
// 1 for shared crosshair.
// 2 for shared crosshair AND shared tooltip.
// memberNames="Off|Crosshair|Tooltip"
export enum DashboardCursorSync {
  Off = 0,
  Crosshair = 1,
  Tooltip = 2,
}

export const defaultDashboardCursorSync = (): DashboardCursorSync => (DashboardCursorSync.Off);

// Links with references to other dashboards or external resources
export interface DashboardLink {
  // Title to display with the link
  title: string;
  // Link type. Accepted values are dashboards (to refer to another dashboard) and link (to refer to an external resource)
  type: DashboardLinkType;
  // Icon name to be displayed with the link
  icon: string;
  // Tooltip to display when the user hovers their mouse over it
  tooltip: string;
  // Link URL. Only required/valid if the type is link
  url?: string;
  // List of tags to limit the linked dashboards. If empty, all dashboards will be displayed. Only valid if the type is dashboards
  tags: string[];
  // If true, all dashboards links will be displayed in a dropdown. If false, all dashboards links will be displayed side by side. Only valid if the type is dashboards
  asDropdown: boolean;
  // If true, the link will be opened in a new tab
  targetBlank: boolean;
  // If true, includes current template variables values in the link as query params
  includeVars: boolean;
  // If true, includes current time range in the link as query params
  keepTime: boolean;
}

export const defaultDashboardLink = (): DashboardLink => ({
  title: "",
  type: defaultDashboardLinkType(),// FIX in CUE PR, for now hardcoding the correct type
  icon: "",
  tooltip: "",
  tags: [],
  asDropdown: false,
  targetBlank: false,
  includeVars: false,
  keepTime: false,
});

export interface DataSourceRef {
  // The plugin type-id
  type?: string;
  // Specific datasource instance
  uid?: string;
}

export const defaultDataSourceRef = (): DataSourceRef => ({
});

// Transformations allow to manipulate data returned by a query before the system applies a visualization.
// Using transformations you can: rename fields, join time series data, perform mathematical operations across queries,
// use the output of one transformation as the input to another transformation, etc.
export interface DataTransformerConfig {
  // Unique identifier of transformer
  id: string;
  // Disabled transformations are skipped
  disabled?: boolean;
  // Optional frame matcher. When missing it will be applied to all results
  filter?: MatcherConfig;
  // Where to pull DataFrames from as input to transformation
  // replaced with common.DataTopic
  topic?: "series" | "annotations" | "alertStates";
  // Options to be passed to the transformer
  // Valid options depend on the transformer id
  options: any;
}

export const defaultDataTransformerConfig = (): DataTransformerConfig => ({
  id: "",
  options: {},
});

// The data model used in Grafana, namely the data frame, is a columnar-oriented table structure that unifies both time series and table query results.
// Each column within this structure is called a field. A field can represent a single time series or table column.
// Field options allow you to change how the data is displayed in your visualizations.
export interface FieldConfigSource {
  // Defaults are the options applied to all fields.
  defaults: FieldConfig;
  // Overrides are the options applied to specific fields overriding the defaults.
  overrides: Array<{
    matcher: MatcherConfig;
    properties: DynamicConfigValue[];
  }>;
}

export const defaultFieldConfigSource = (): FieldConfigSource => ({
  defaults: defaultFieldConfig(),
  overrides: [],
});

// The data model used in Grafana, namely the data frame, is a columnar-oriented table structure that unifies both time series and table query results.
// Each column within this structure is called a field. A field can represent a single time series or table column.
// Field options allow you to change how the data is displayed in your visualizations.
export interface FieldConfig {
  // The display value for this field.  This supports template variables blank is auto
  displayName?: string;
  // This can be used by data sources that return and explicit naming structure for values and labels
  // When this property is configured, this value is used rather than the default naming strategy.
  displayNameFromDS?: string;
  // Human readable field metadata
  description?: string;
  // An explicit path to the field in the datasource.  When the frame meta includes a path,
  // This will default to `${frame.meta.path}/${field.name}
  //
  // When defined, this value can be used as an identifier within the datasource scope, and
  // may be used to update the results
  path?: string;
  // True if data source can write a value to the path. Auth/authz are supported separately
  writeable?: boolean;
  // True if data source field supports ad-hoc filters
  filterable?: boolean;
  // Unit a field should use. The unit you select is applied to all fields except time.
  // You can use the units ID availables in Grafana or a custom unit.
  // Available units in Grafana: https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/valueFormats/categories.ts
  // As custom unit, you can use the following formats:
  // `suffix:<suffix>` for custom unit that should go after value.
  // `prefix:<prefix>` for custom unit that should go before value.
  // `time:<format>` For custom date time formats type for example `time:YYYY-MM-DD`.
  // `si:<base scale><unit characters>` for custom SI units. For example: `si: mF`. This one is a bit more advanced as you can specify both a unit and the source data scale. So if your source data is represented as milli (thousands of) something prefix the unit with that SI scale character.
  // `count:<unit>` for a custom count unit.
  // `currency:<unit>` for custom a currency unit.
  unit?: string;
  // Specify the number of decimals Grafana includes in the rendered value.
  // If you leave this field blank, Grafana automatically truncates the number of decimals based on the value.
  // For example 1.1234 will display as 1.12 and 100.456 will display as 100.
  // To display all decimals, set the unit to `String`.
  decimals?: number;
  // The minimum value used in percentage threshold calculations. Leave blank for auto calculation based on all series and fields.
  min?: number;
  // The maximum value used in percentage threshold calculations. Leave blank for auto calculation based on all series and fields.
  max?: number;
  // Convert input values into a display string
  mappings?: ValueMapping[];
  // Map numeric values to states
  thresholds?: ThresholdsConfig;
  // Panel color configuration
  color?: FieldColor;
  // The behavior when clicking on a result
  links?: any[];
  // Alternative to empty string
  noValue?: string;
  // custom is specified by the FieldConfig field
  // in panel plugin schemas.
  custom?: Record<string, any>;
}

export const defaultFieldConfig = (): FieldConfig => ({
});

export interface DynamicConfigValue {
  id: string;
  value?: any;
}

export const defaultDynamicConfigValue = (): DynamicConfigValue => ({
  id: "",
});

// Matcher is a predicate configuration. Based on the config a set of field(s) or values is filtered in order to apply override / transformation.
// It comes with in id ( to resolve implementation from registry) and a configuration that’s specific to a particular matcher type.
export interface MatcherConfig {
  // The matcher id. This is used to find the matcher implementation from registry.
  id: string;
  // The matcher options. This is specific to the matcher implementation.
  options?: any;
}

export const defaultMatcherConfig = (): MatcherConfig => ({
  id: "",
});

export interface Threshold {
  value: number | null;
  color: string;
}

export const defaultThreshold = (): Threshold => ({
  value: 0,
  color: "",
});

export enum ThresholdsMode {
  Absolute = "absolute",
  Percentage = "percentage",
}

export const defaultThresholdsMode = (): ThresholdsMode => (ThresholdsMode.Absolute);

export interface ThresholdsConfig {
  mode: ThresholdsMode;
  steps: Threshold[];
}

export const defaultThresholdsConfig = (): ThresholdsConfig => ({
  mode: ThresholdsMode.Absolute,
  steps: [],
});

export type ValueMapping = ValueMap | RangeMap | RegexMap | SpecialValueMap;

export const defaultValueMapping = (): ValueMapping => (defaultValueMap());

// Supported value mapping types
// `value`: Maps text values to a color or different display text and color. For example, you can configure a value mapping so that all instances of the value 10 appear as Perfection! rather than the number.
// `range`: Maps numerical ranges to a display text and color. For example, if a value is within a certain range, you can configure a range value mapping to display Low or High rather than the number.
// `regex`: Maps regular expressions to replacement text and a color. For example, if a value is www.example.com, you can configure a regex value mapping so that Grafana displays www and truncates the domain.
// `special`: Maps special values like Null, NaN (not a number), and boolean values like true and false to a display text and color. See SpecialValueMatch to see the list of special values. For example, you can configure a special value mapping so that null values appear as N/A.
export enum MappingType {
  Value = "value",
  Range = "range",
  Regex = "regex",
  Special = "special",
}

export const defaultMappingType = (): MappingType => (MappingType.Value);

// Maps text values to a color or different display text and color.
// For example, you can configure a value mapping so that all instances of the value 10 appear as Perfection! rather than the number.
export interface ValueMap {
  type: "value";
  // Map with <value_to_match>: ValueMappingResult. For example: { "10": { text: "Perfection!", color: "green" } }
  options: Record<string, ValueMappingResult>;
}

export const defaultValueMap = (): ValueMap => ({
  type: "value",
  options: {},
});

// Maps numerical ranges to a display text and color.
// For example, if a value is within a certain range, you can configure a range value mapping to display Low or High rather than the number.
export interface RangeMap {
  type: "range";
  // Range to match against and the result to apply when the value is within the range
  options: {
    // Min value of the range. It can be null which means -Infinity
    from: number | null;
    // Max value of the range. It can be null which means +Infinity
    to: number | null;
    // Config to apply when the value is within the range
    result: ValueMappingResult;
  };
}

export const defaultRangeMap = (): RangeMap => ({
  type: "range",
  options: {
    from: 0,
    to: 0,
    result: defaultValueMappingResult(),
  },
});

// Maps regular expressions to replacement text and a color.
// For example, if a value is www.example.com, you can configure a regex value mapping so that Grafana displays www and truncates the domain.
export interface RegexMap {
  type: "regex";
  // Regular expression to match against and the result to apply when the value matches the regex
  options: {
    // Regular expression to match against
    pattern: string;
    // Config to apply when the value matches the regex
    result: ValueMappingResult;
  };
}

export const defaultRegexMap = (): RegexMap => ({
  type: "regex",
  options: {
    pattern: "",
    result: defaultValueMappingResult(),
  },
});

// Maps special values like Null, NaN (not a number), and boolean values like true and false to a display text and color.
// See SpecialValueMatch to see the list of special values.
// For example, you can configure a special value mapping so that null values appear as N/A.
export interface SpecialValueMap {
  type: "special";
  options: {
    // Special value to match against
    match: SpecialValueMatch;
    // Config to apply when the value matches the special value
    result: ValueMappingResult;
  };
}

export const defaultSpecialValueMap = (): SpecialValueMap => ({
  type: "special",
  options: {
    match: SpecialValueMatch.True,
    result: defaultValueMappingResult(),
  },
});

// Special value types supported by the `SpecialValueMap`
export enum SpecialValueMatch {
  True = "true",
  False = "false",
  Null = "null",
  NotANumber = "nan",
  NullNan = "null+nan",
  Empty = "empty",
}

export const defaultSpecialValueMatch = (): SpecialValueMatch => (SpecialValueMatch.True);

// Result used as replacement with text and color when the value matches
export interface ValueMappingResult {
  // Text to display when the value matches
  text?: string;
  // Text to use when the value matches
  color?: string;
  // Icon to display when the value matches. Only specific visualizations.
  icon?: string;
  // Position in the mapping array. Only used internally.
  index?: number;
}

export const defaultValueMappingResult = (): ValueMappingResult => ({
});

// Color mode for a field. You can specify a single color, or select a continuous (gradient) color schemes, based on a value.
// Continuous color interpolates a color using the percentage of a value relative to min and max.
// Accepted values are:
// `thresholds`: From thresholds. Informs Grafana to take the color from the matching threshold
// `palette-classic`: Classic palette. Grafana will assign color by looking up a color in a palette by series index. Useful for Graphs and pie charts and other categorical data visualizations
// `palette-classic-by-name`: Classic palette (by name). Grafana will assign color by looking up a color in a palette by series name. Useful for Graphs and pie charts and other categorical data visualizations
// `continuous-GrYlRd`: ontinuous Green-Yellow-Red palette mode
// `continuous-RdYlGr`: Continuous Red-Yellow-Green palette mode
// `continuous-BlYlRd`: Continuous Blue-Yellow-Red palette mode
// `continuous-YlRd`: Continuous Yellow-Red palette mode
// `continuous-BlPu`: Continuous Blue-Purple palette mode
// `continuous-YlBl`: Continuous Yellow-Blue palette mode
// `continuous-blues`: Continuous Blue palette mode
// `continuous-reds`: Continuous Red palette mode
// `continuous-greens`: Continuous Green palette mode
// `continuous-purples`: Continuous Purple palette mode
// `shades`: Shades of a single color. Specify a single color, useful in an override rule.
// `fixed`: Fixed color mode. Specify a single color, useful in an override rule.
export enum FieldColorModeId {
  Thresholds = "thresholds",
  PaletteClassic = "palette-classic",
  PaletteClassicByName = "palette-classic-by-name",
  ContinuousGrYlRd = "continuous-GrYlRd",
  ContinuousRdYlGr = "continuous-RdYlGr",
  ContinuousBlYlRd = "continuous-BlYlRd",
  ContinuousYlRd = "continuous-YlRd",
  ContinuousBlPu = "continuous-BlPu",
  ContinuousYlBl = "continuous-YlBl",
  ContinuousBlues = "continuous-blues",
  ContinuousReds = "continuous-reds",
  ContinuousGreens = "continuous-greens",
  ContinuousPurples = "continuous-purples",
  Fixed = "fixed",
  Shades = "shades",
}

export const defaultFieldColorModeId = (): FieldColorModeId => (FieldColorModeId.Thresholds);

// Defines how to assign a series color from "by value" color schemes. For example for an aggregated data points like a timeseries, the color can be assigned by the min, max or last value.
export enum FieldColorSeriesByMode {
  Min = "min",
  Max = "max",
  Last = "last",
}

export const defaultFieldColorSeriesByMode = (): FieldColorSeriesByMode => (FieldColorSeriesByMode.Min);

// Map a field to a color.
export interface FieldColor {
  // The main color scheme mode.
  mode: FieldColorModeId;
  // The fixed color value for fixed or shades color modes.
  fixedColor?: string;
  // Some visualizations need to know how to assign a series color from by value color schemes.
  seriesBy?: FieldColorSeriesByMode;
}

export const defaultFieldColor = (): FieldColor => ({
  mode: FieldColorModeId.Thresholds,
});

//FIXME: in Schema v2 in CUE PR
// hardcoding correct type here
export type DashboardLinkType = ('link' | 'dashboards');

export const defaultDashboardLinkType = (): DashboardLinkType => ('link');

// --- Common types ---
export interface Kind {
  kind: string;
  spec: any;
  metadata?: any;
}

export const defaultKind = (): Kind => ({
  kind: "",
  spec: {},
});

// --- Kinds ---
export interface VizConfigSpec {
  pluginVersion: string;
  options: Record<string, any>;
  fieldConfig: FieldConfigSource;
}

export const defaultVizConfigSpec = (): VizConfigSpec => ({
  pluginVersion: "",
  options: {},
  fieldConfig: defaultFieldConfigSource(),
});

export interface VizConfigKind {
  kind: string;
  spec: VizConfigSpec;
}

export const defaultVizConfigKind = (): VizConfigKind => ({
  kind: "",
  spec: defaultVizConfigSpec(),
});

export interface AnnotationQuerySpec {
  datasource: DataSourceRef;
  query: DataQueryKind;
  // TODO: Should be figured out based on datasource (Grafana ds)
  // builtIn?: int
  // Below are currently existing options for annotation queries
  enable: boolean;
  filter: AnnotationPanelFilter;
  hide: boolean;
  iconColor: string;
  name: string;
}

export const defaultAnnotationQuerySpec = (): AnnotationQuerySpec => ({
  datasource: defaultDataSourceRef(),
  query: defaultDataQueryKind(),
  enable: false,
  filter: defaultAnnotationPanelFilter(),
  hide: false,
  iconColor: "",
  name: "",
});

export interface AnnotationQueryKind {
  kind: "AnnotationQuery";
  spec: AnnotationQuerySpec;
}

export const defaultAnnotationQueryKind = (): AnnotationQueryKind => ({
  kind: "AnnotationQuery",
  spec: defaultAnnotationQuerySpec(),
});

export interface QueryOptionsSpec {
  timeFrom?: string;
  maxDataPoints?: number;
  timeShift?: string;
  queryCachingTTL?: number;
  interval?: string;
  cacheTimeout?: string;
}

export const defaultQueryOptionsSpec = (): QueryOptionsSpec => ({
});

export interface DataQueryKind {
  kind: string;
  spec: Record<string, any>;
}

export const defaultDataQueryKind = (): DataQueryKind => ({
  kind: "",
  spec: {},
});

export interface PanelQuerySpec {
  query: DataQueryKind;
  datasource: DataSourceRef;
  refId: string;
  hidden: boolean;
}

export const defaultPanelQuerySpec = (): PanelQuerySpec => ({
  query: defaultDataQueryKind(),
  datasource: defaultDataSourceRef(),
  refId: "",
  hidden: false,
});

export interface PanelQueryKind {
  kind: "PanelQuery";
  spec: PanelQuerySpec;
}

export const defaultPanelQueryKind = (): PanelQueryKind => ({
  kind: "PanelQuery",
  spec: defaultPanelQuerySpec(),
});

export interface TransformationKind {
  kind: string;
  spec: DataTransformerConfig;
}

export const defaultTransformationKind = (): TransformationKind => ({
  kind: "",
  spec: defaultDataTransformerConfig(),
});

export interface QueryGroupSpec {
  queries: PanelQueryKind[];
  transformations: TransformationKind[];
  queryOptions: QueryOptionsSpec;
}

export const defaultQueryGroupSpec = (): QueryGroupSpec => ({
  queries: [],
  transformations: [],
  queryOptions: defaultQueryOptionsSpec(),
});

export interface QueryGroupKind {
  kind: "QueryGroup";
  spec: QueryGroupSpec;
}

export const defaultQueryGroupKind = (): QueryGroupKind => ({
  kind: "QueryGroup",
  spec: defaultQueryGroupSpec(),
});

/*** Start FIXME: variables - in CUE PR - this are things that should be added into the cue schema
*
* TODO: properties such as `hide`, `skipUrlSync`, `multi` are type boolean, and in the old schema they are conditional,
* should we make them conditional in the new schema as well? or should we make them required but default to false?
*
* **/

// Variable types
export type VariableValue = VariableValueSingle | VariableValueSingle[];
/**
 * Used in CustomFormatterFn
 */
export interface CustomFormatterVariable {
  name: string;
  type: VariableType;
  multi: boolean;
  includeAll: boolean;
}

export type VariableCustomFormatterFn = (
  value: unknown,
  legacyVariableModel: Partial<CustomFormatterVariable>,
  legacyDefaultFormatter?: VariableCustomFormatterFn
) => string;

/**
 * This is for edge case values like the custom "allValue" that should not be escaped/formatted like other values
 * The custom all value usually contain wildcards that should not be escaped.
 */
export interface CustomVariableValue {
  /**
   * The format name or function used in the expression
   */
  formatter(formatNameOrFn?: string | VariableCustomFormatterFn): string;
}

export type VariableValueSingle = string | boolean | number | CustomVariableValue;

export interface VariableValueOption {
  label: string;
  value: VariableValueSingle;
  group?: string;
}

// query variable
export type QueryVariableSpec = {
  name: string;
  value: VariableValue;
  text: VariableValue;
  current: VariableOption;
  label?: string;
  hide: boolean;
  skipUrlSync: boolean;
  description?: string;
  datasource: DataSourceRef;
  query: string | DataQueryKind;
  regex: string;
  sort: VariableSort
  definition?: string;
  options: VariableValueOption[];
  isMulti: boolean;
  includeAll: boolean;
  allValue?: string;
  placeholder?: string;
};

export const defaultQueryVariableSpec = (): QueryVariableSpec => ({
  name: "",
  value: "",
  datasource: {},//FIXME: check if this is undefined. null or empty object in provisioning use case when we want to fallback to the default datasource
  text: "",
  current: {
    text: "",
    value: "",
  },
  query: "",
  regex: "",
  sort: VariableSort.disabled,
  options: [],
  isMulti: false,
  includeAll: false,
  hide: false,
  skipUrlSync: false,
});

export interface QueryVariableKind {
  kind: "Query";
  spec: QueryVariableSpec;
}

export const defaultQueryVariableKind = (): QueryVariableKind => ({
  kind: "Query",
  spec: defaultQueryVariableSpec(),
});

// Text variable
export type TextVariableSpec = {
  name: string;
  value: string;
  label?: string;
  hide: boolean;
  skipUrlSync: boolean;
  description?: string;
};

export const defaultTextVariableSpec = (): TextVariableSpec => ({
  name: "",
  value: "",
  hide: false,
  skipUrlSync: false,
});

export interface TextVariableKind {
  kind: "Text";
  spec: TextVariableSpec;
}

export const defaultTextVariableKind = (): TextVariableKind => ({
  kind: "Text",
  spec: defaultTextVariableSpec(),
});

// constant variable
export interface ConstantVariableKind {
  kind: "Constant";
  spec: ConstantVariableSpec;
}

export interface ConstantVariableSpec {
  name: string;
  value: string;
  label?: string;
  hide: boolean;
  skipUrlSync: boolean;
  description?: string;
}

export const defaultConstantVariableSpec = (): ConstantVariableSpec => ({
  name: "",
  value: "",
  hide: false,
  skipUrlSync: false,
});

// datasource variable

export interface DatasourceVariableKind {
  kind: "Datasource";
  spec: DatasourceVariableSpec;
}

export interface DatasourceVariableSpec {
  name: string;
  value: string;
  text: string;
  pluginId: string;
  regex: string;
  current: VariableOption;
  defaultOptionEnabled: boolean; // FIXME: is this going to be removed in the future https://github.com/grafana/scenes/blob/main/packages/scenes/src/variables/variants/DataSourceVariable.tsx#L24?
  options: VariableValueOption[];
  isMulti: boolean;
  includeAll: boolean;
  allValue?: string;
  label?: string;
  hide: boolean;
  skipUrlSync: boolean;
  description?: string;
}

export const defaultDatasourceVariableSpec = (): DatasourceVariableSpec => ({
  name: "",
  value: "",
  text: "",
  options: [],
  current: {
    text: "",
    value: "",
  },
  pluginId: "",
  regex: "",
  defaultOptionEnabled: false,
  isMulti: false,
  includeAll: false,
  hide: false,
  skipUrlSync: false,
})

// interval variable
export interface IntervalVariableKind {
  kind: "Interval";
  spec: IntervalVariableSpec;
}

export interface IntervalVariableSpec {
  name: string;
  value: string;
  intervals: string[];
  current: VariableOption;
  autoEnabled: boolean;
  autoMinInterval: string;
  autoStepCount: number;
  refresh: VariableRefresh;
  label?: string;
  hide: boolean;
  skipUrlSync: boolean;
  description?: string;
}

export const defaultIntervalVariableSpec = (): IntervalVariableSpec => ({
  name: "",
  value: "",
  intervals: [],
  current: {
    text: "",
    value: "",
  },
  autoEnabled: false,
  autoMinInterval: "",
  autoStepCount: 0,
  refresh: VariableRefresh.onTimeRangeChanged,
  hide: false,
  skipUrlSync: false,
});

// custom variable
export interface CustomVariableKind {
  kind: "Custom";
  spec: CustomVariableSpec;
}

export interface CustomVariableSpec {
  name: string;
  value: VariableValue;
  query: string;
  text: VariableValue;
  current: VariableOption;
  options: VariableValueOption[];
  isMulti: boolean;
  includeAll: boolean;
  allValue?: string;
  label?: string;
  hide: boolean;
  skipUrlSync: boolean;
  description?: string;
};

export const defaultCustomVariableSpec = (): CustomVariableSpec => ({
  name: "",
  value: "",
  query: "",
  text: "",
  current: {
    text: "",
    value: "",
  },
  options: [],
  isMulti: false,
  includeAll: false,
  hide: false,
  skipUrlSync: false,
});

// group variable
export interface GroupVariableKind {
  kind: "GroupBy";
  spec: GroupVariableSpec;
}

export interface GroupVariableSpec {
  name: string;
  value: string;
  datasource: DataSourceRef;
  current?: VariableOption;
  text: VariableValue;
  options: VariableValueOption[];
  isMulti: boolean;
  includeAll: boolean;
  allValue?: string;
  label?: string;
  hide: boolean;
  skipUrlSync: boolean;
  description?: string;
}

export const defaultGroupVariableSpec = (): GroupVariableSpec => ({
  name: "",
  value: "",
  datasource: {},
  text: "",
  options: [],
  isMulti: false,
  includeAll: false,
  hide: false,
  skipUrlSync: false,
});

// adhoc variable
export interface AdhocVariableKind {
  kind: "Adhoc";
  spec: AdhocVariableSpec;
}

//Start FIXME: grafana-data? verify where this types should live, right now are defined in grafana-data package
export interface AdHocVariableFilter {
  key: string;
  operator: string;
  value: string;
  values?: string[];
  /** @deprecated  */
  condition?: string;
}

export interface AdHocFilterWithLabels extends AdHocVariableFilter {
  keyLabel?: string;
  valueLabels?: string[];
  // this is used to externally trigger edit mode in combobox filter UI
  forceEdit?: boolean;
}

export interface MetricFindValue {
  text: string;
  value?: string | number;
  group?: string;
  expandable?: boolean;
}

//End FIXME: grafana-data? verify where this types should live, right now are defined in grafana-data package

export interface AdhocVariableSpec {
  name: string;
  datasource: DataSourceRef;
  baseFilters: AdHocFilterWithLabels[];
  filters: AdHocFilterWithLabels[];
  defaultKeys: MetricFindValue[];
  label?: string;
  hide: boolean;
  skipUrlSync: boolean;
  description?: string;
}

export const defaultAdhocVariableSpec = (): AdhocVariableSpec => ({
  name: "",
  datasource: {},
  baseFilters: [],
  filters: [],
  defaultKeys: [],
  hide: false,
  skipUrlSync: false,
});


/***END  FIXME:variables - in CUE PR - this are things that should be added into the cue schema **/

// Time configuration
// It defines the default time config for the time picker, the refresh picker for the specific dashboard.
export interface TimeSettingsSpec {
  // Timezone of dashboard. Accepted values are IANA TZDB zone ID or "browser" or "utc".
  timezone?: string;
  // Start time range for dashboard.
  // Accepted values are relative time strings like 'now-6h' or absolute time strings like '2020-07-10T08:00:00.000Z'.
  from: string;
  // End time range for dashboard.
  // Accepted values are relative time strings like 'now-6h' or absolute time strings like '2020-07-10T08:00:00.000Z'.
  to: string;
  // Refresh rate of dashboard. Represented via interval string, e.g. "5s", "1m", "1h", "1d".
  // v1: refresh
  autoRefresh: string;
  // Interval options available in the refresh picker dropdown.
  // v1: timepicker.refresh_intervals
  autoRefreshIntervals: string[];
  // Selectable options available in the time picker dropdown. Has no effect on provisioned dashboard.
  // v1: timepicker.time_options , not exposed in the UI
  quickRanges: string[];
  // Whether timepicker is visible or not.
  // v1: timepicker.hidden
  hideTimepicker: boolean;
  // Day when the week starts. Expressed by the name of the day in lowercase, e.g. "monday".
  weekStart: string;
  // The month that the fiscal year starts on. 0 = January, 11 = December
  fiscalYearStartMonth: number;
  // Override the now time by entering a time delay. Use this option to accommodate known delays in data aggregation to avoid null values.
  // v1: timepicker.nowDelay
  nowDelay?: string;
}

export const defaultTimeSettingsSpec = (): TimeSettingsSpec => ({
  timezone: "browser",
  from: "now-6h",
  to: "now",
  autoRefresh: "",
  autoRefreshIntervals: [
    "5s",
    "10s",
    "30s",
    "1m",
    "5m",
    "15m",
    "30m",
    "1h",
    "2h",
    "1d",
  ],
  quickRanges: [
    "5m",
    "15m",
    "1h",
    "6h",
    "12h",
    "24h",
    "2d",
    "7d",
    "30d",
  ],
  hideTimepicker: false,
  weekStart: "",
  fiscalYearStartMonth: 0,
});

export interface GridLayoutItemSpec {
  x: number;
  y: number;
  width: number;
  height: number;
  // reference to a PanelKind from dashboard.spec.elements Expressed as JSON Schema reference
  element: ElementReferenceKind;
}

export const defaultGridLayoutItemSpec = (): GridLayoutItemSpec => ({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  element: defaultElementReferenceKind(),
});

export interface GridLayoutItemKind {
  kind: "GridLayoutItem";
  spec: GridLayoutItemSpec;
}

export const defaultGridLayoutItemKind = (): GridLayoutItemKind => ({
  kind: "GridLayoutItem",
  spec: defaultGridLayoutItemSpec(),
});

export interface GridLayoutSpec {
  items: GridLayoutItemKind[];
}

export const defaultGridLayoutSpec = (): GridLayoutSpec => ({
  items: [],
});

export interface GridLayoutKind {
  kind: "GridLayout";
  spec: GridLayoutSpec;
}

export const defaultGridLayoutKind = (): GridLayoutKind => ({
  kind: "GridLayout",
  spec: defaultGridLayoutSpec(),
});

export interface PanelSpec {
  uid: string;
  title: string;
  description: string;
  links: DashboardLink[];
  data: QueryGroupKind;
  vizConfig: VizConfigKind;
}

export const defaultPanelSpec = (): PanelSpec => ({
  uid: "",
  title: "",
  description: "",
  links: [],
  data: defaultQueryGroupKind(),
  vizConfig: defaultVizConfigKind(),
});

export interface PanelKind {
  kind: "Panel";
  spec: PanelSpec;
}

export const defaultPanelKind = (): PanelKind => ({
  kind: "Panel",
  spec: defaultPanelSpec(),
});

export interface ElementReferenceKind {
  kind: "ElementReference";
  spec: ElementReferenceSpec;
}

export const defaultElementReferenceKind = (): ElementReferenceKind => ({
  kind: "ElementReference",
  spec: defaultElementReferenceSpec(),
});

export interface ElementReferenceSpec {
  name: string;
}

export const defaultElementReferenceSpec = (): ElementReferenceSpec => ({
  name: "",
});

